import { AwsClient } from 'aws4fetch';

/** Cloudflare R2(S3 호환) — 백업 전용 비공개 버킷. 서버에서만 쓴다(키는 Vercel 환경변수에만 둔다).
 *  R2_ACCOUNT_ID · R2_ACCESS_KEY_ID · R2_SECRET_ACCESS_KEY · R2_BACKUP_BUCKET(예: sogang-me-backup)
 *  R2_MEDIA_BUCKET(선택, 기본 sogang-me-media): 옛 홈페이지 사진·첨부가 있는 공개 버킷 — 백업 버킷으로 한 번씩 복사해 둔다. */
export const r2Enabled = () => !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BACKUP_BUCKET);
export const backupBucket = () => process.env.R2_BACKUP_BUCKET || '';
export const mediaBucket = () => process.env.R2_MEDIA_BUCKET || 'sogang-me-media';

let client: AwsClient | null = null;
function aws() {
  if (!client) client = new AwsClient({ accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!, service: 's3', region: 'auto' });
  return client;
}
const endpoint = () => `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const enc = (key: string) => key.split('/').map(encodeURIComponent).join('/');
const url = (bucket: string, key = '') => `${endpoint()}/${bucket}${key ? '/' + enc(key) : ''}`;
const unxml = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

/** R2 요청 하나가 멈춰 전체 작업이 시간 초과되지 않도록 25초 제한 */
const call = (u: string, init: RequestInit = {}) => aws().fetch(u, { ...init, signal: AbortSignal.timeout(25_000) } as any);
async function ok(res: Response, what: string) {
  if (!res.ok) throw new Error(`R2 ${what} 실패 (${res.status}) ${(await res.text()).slice(0, 200)}`);
  return res;
}

export async function r2Put(key: string, body: Uint8Array | string, contentType = 'application/octet-stream', bucket = backupBucket()) {
  await ok(await call(url(bucket, key), { method: 'PUT', body: body as any, headers: { 'content-type': contentType } }), `저장(${key})`);
}
export async function r2Delete(key: string, bucket = backupBucket()) {
  await ok(await call(url(bucket, key), { method: 'DELETE' }), `삭제(${key})`);
}
/** 같은 계정 안의 버킷 간 서버 측 복사 — 내려받지 않으므로 전송 요금·시간이 들지 않는다 */
export async function r2Copy(srcBucket: string, key: string, destKey: string, bucket = backupBucket()) {
  await ok(await call(url(bucket, destKey), { method: 'PUT', headers: { 'x-amz-copy-source': `/${srcBucket}/${enc(key)}` } }), `복사(${key})`);
}
export type R2Obj = { key: string; size: number; modified: string };
/** 접두어 아래 목록(최대 limit개, startAfter 다음 키부터 — 큰 버킷을 여러 번에 나눠 읽을 때) */
export async function r2List(prefix: string, bucket = backupBucket(), limit = 100000, startAfter = ''): Promise<R2Obj[]> {
  const out: R2Obj[] = []; let token = '';
  do {
    const q = new URLSearchParams({ 'list-type': '2', prefix, 'max-keys': String(Math.min(1000, limit - out.length)) });
    if (token) q.set('continuation-token', token); else if (startAfter) q.set('start-after', startAfter);
    const xml = await (await ok(await call(`${url(bucket)}?${q}`), '목록')).text();
    for (const m of Array.from(xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g))) {
      const c = m[1];
      out.push({ key: unxml((c.match(/<Key>([\s\S]*?)<\/Key>/) || [])[1] || ''), size: Number((c.match(/<Size>(\d+)<\/Size>/) || [])[1] || 0), modified: (c.match(/<LastModified>(.*?)<\/LastModified>/) || [])[1] || '' });
    }
    token = /<IsTruncated>true<\/IsTruncated>/.test(xml) ? unxml((xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/) || [])[1] || '') : '';
  } while (token && out.length < limit);
  return out;
}
/** 관리자 내려받기용 5분짜리 서명 주소 */
export async function r2SignedGet(key: string, seconds = 300, bucket = backupBucket()) {
  const u = new URL(url(bucket, key)); u.searchParams.set('X-Amz-Expires', String(seconds));
  const signed = await aws().sign(u.toString(), { method: 'GET', aws: { signQuery: true } });
  return signed.url;
}
