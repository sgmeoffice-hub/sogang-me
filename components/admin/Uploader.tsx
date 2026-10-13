'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

const MAX_MB = 10;              // 업로드 허용 최대 용량
const MAX_EDGE = 1920;          // 이미지 최대 가로/세로 (px)
const JPEG_QUALITY = 0.82;

/** 올릴 수 있는 확장자와 저장할 content-type (2026-10-13). 공개 'media' 버킷은 Supabase 원본에서 그대로 서빙되므로
 *  html·svg·js 같은 실행 가능한 형식이 올라가면 피싱 표면이 된다 — 확장자 허용 목록 + 확장자 기준 MIME만 저장(브라우저가 준 f.type은 믿지 않음). */
const IMAGE_MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
const FILE_MIME: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  hwp: 'application/x-hwp', hwpx: 'application/hwp+zip', rtf: 'application/rtf', dot: 'application/msword', txt: 'text/plain', csv: 'text/csv',
  // 압축·영상: 버킷 전체 목록(scripts/r2-inventory.json, 옛 홈페이지 첨부 포함)에는 zip만 쓰였지만 국내 공지에 흔한 egg·alz·rar·7z와 mp4는
  // 실행 가능한 형식이 아니므로 막을 이유가 없다 — 관리자가 쓰던 파일이 갑자기 거부되는 일을 피한다(2026-10-13).
  zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed', egg: 'application/octet-stream', alz: 'application/octet-stream', mp4: 'video/mp4',
};
const FILE_EXTS = Object.keys(FILE_MIME).join('·');   // 오류 안내문 — 목록과 어긋나지 않게 맵에서 만든다
/** 첨부파일 <input accept> 값 — PostForm 첨부 업로더에서 사용 */
export const FILE_ACCEPT = Object.keys({ ...IMAGE_MIME, ...FILE_MIME }).map((e) => `.${e}`).join(',');

/** 큰 사진은 업로드 전에 브라우저에서 축소해 저장소 용량과 페이지 로딩을 아낍니다.
 *  투명 영역이 있으면(로고·도식·투명 배너) PNG로, 아니면 JPEG으로 — 예전에는 무조건 JPEG이라 투명 픽셀이 검게 칠해졌다(2026-10-13). */
async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= 1_200_000) return file;
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const ctx = c.getContext('2d')!; ctx.drawImage(bmp, 0, 0, w, h);
    let alpha = false;
    if (file.type !== 'image/jpeg') { const d = ctx.getImageData(0, 0, w, h).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 255) { alpha = true; break; } }
    const type = alpha ? 'image/png' : 'image/jpeg';
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, type, JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;
    // 확장자·MIME은 요청한 형식이 아니라 실제 인코딩 결과(blob.type)에서 정한다 — 일부 브라우저는 지원하지 않는 형식을 PNG로 대체한다
    const ext = blob.type === 'image/png' ? '.png' : '.jpg';
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + ext, { type: blob.type });
  } catch { return file; }
}

export async function uploadToMedia(file: File, folder = 'uploads', imagesOnly = false) {
  const sb = createClient();
  const f = await shrinkImage(file);
  if (f.size > MAX_MB * 1024 * 1024) throw new Error(`${MAX_MB}MB 이하 파일만 올릴 수 있습니다 (현재 ${(f.size / 1024 / 1024).toFixed(1)}MB)`);
  const ext = (f.name.includes('.') ? f.name.split('.').pop() || '' : '').toLowerCase();
  const contentType = IMAGE_MIME[ext] || (imagesOnly ? undefined : FILE_MIME[ext]);
  if (!contentType) throw new Error(`허용되지 않는 파일 형식입니다 (${ext ? `.${ext}` : '확장자 없음'}). 사진: jpg·png·gif·webp${imagesOnly ? '' : ` / 문서·압축·영상: ${FILE_EXTS}`}`);
  const safe = f.name.replace(/[^\w.\-가-힣]/g, '_');
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, f, { upsert: false, contentType });
  if (error) throw error;
  const { data } = sb.storage.from('media').getPublicUrl(path);
  return { url: data.publicUrl, name: safe, size: f.size };
}

export default function Uploader({ folder, accept, multiple, onDone, label = '파일 선택' }: { folder: string; accept?: string; multiple?: boolean; onDone: (files: { url: string; name: string; size: number }[]) => void; label?: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [done, setDone] = useState(0);
  const imagesOnly = !!accept?.startsWith('image/');   // accept="image/*" 업로더(사진·배너·교수 사진)는 문서 확장자도 거른다
  return (
    <label className="inline-flex items-center gap-2 px-3 py-2 border border-sg-line bg-white text-[13px] cursor-pointer hover:border-sg-ink">
      <input type="file" accept={accept} multiple={multiple} className="hidden" onChange={async (e) => {
        const files = Array.from(e.target.files || []); if (!files.length) return;
        setBusy(true); setErr('');
        try { const out = []; for (const f of files) out.push(await uploadToMedia(f, folder, imagesOnly)); onDone(out); setDone(out.length); setTimeout(() => setDone(0), 4000); }
        catch (x: any) { setErr(x.message || 'upload failed'); }
        setBusy(false); e.target.value = '';
      }} />
      {busy ? '업로드 중…' : done ? `✓ ${done}개 업로드 완료` : label}{err && <span className="text-sg-red break-keep">{err}</span>}
    </label>
  );
}
