'use client';
import { useState } from 'react';
import RichEditor from './RichEditor';
import Uploader from './Uploader';
import TranslateButton from './TranslateButton';
import { boards, festivalCategories } from '@/lib/nav';
import { ui } from '@/lib/i18n';
import { savePost, deletePost } from '@/app/admin/actions';

export default function PostForm({ post, defaultBoard }: { post?: any; defaultBoard?: string }) {
  const [images, setImages] = useState<{ url: string; caption?: string }[]>(post?.images || []);
  const [files, setFiles] = useState<{ url: string; name: string; size?: number }[]>(post?.attachments || []);
  const [thumb, setThumb] = useState<string>(post?.thumbnail_url || '');
  const [enTitle, setEnTitle] = useState(post?.title_en || '');
  const [board, setBoard] = useState<string>(post?.board || defaultBoard || 'notice');
  const showTerm = ['capstone', 'festival'].includes(board); const showCat = ['festival', 'videos'].includes(board); const showOrder = ['videos', 'capstone', 'promo', 'festival'].includes(board);
  return (
    <form action={savePost} className="space-y-6 max-w-5xl">
      {post?.id && <input type="hidden" name="id" value={post.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="attachments" value={JSON.stringify(files)} />
      <input type="hidden" name="thumbnail_url" value={thumb} />
      <div className="grid gap-4 md:grid-cols-[180px_1fr_160px]">
        <label className="text-[13px]">게시판<select name="board" value={board} onChange={(e) => setBoard(e.target.value)} className="input mt-1">{boards.map((b) => <option key={b} value={b}>{ui.ko[b]}</option>)}</select></label>
        <label className="text-[13px]">작성자<input name="author" defaultValue={post?.author || '기계공학과'} className="input mt-1" /></label>
        <label className="text-[13px]">작성일<input name="created_at" type="date" defaultValue={post?.created_at?.slice(0, 10)} className="input mt-1" /></label>
      </div>
      {(showTerm || showCat || showOrder) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border border-[rgba(175,39,47,0.3)] bg-[rgba(175,39,47,0.05)] p-4">
          {showTerm && <label className="text-[13px]">학년도-학기 *<input name="term" required defaultValue={post?.term || ''} placeholder={board === 'festival' ? '예: 2025' : '예: 2025-2'} className="input mt-1" /><span className="block text-[11px] text-sg-steel mt-1">{board === 'festival' ? '연도 4자리' : '형식: 2025-1 / 2025-2'}</span></label>}
          {showTerm && <label className="text-[13px]">조원<input name="members" defaultValue={post?.members || ''} placeholder="김OO, 이OO, 박OO" className="input mt-1" /></label>}
          {showTerm && <label className="text-[13px]">지도교수<input name="advisor" defaultValue={post?.advisor || ''} placeholder="OOO 교수" className="input mt-1" /></label>}
          {showCat && board === 'festival' && <label className="text-[13px]">구분 *<select name="category" required defaultValue={post?.category || 'ureca'} className="input mt-1">{festivalCategories.map((c) => <option key={c.id} value={c.id}>{c.ko}</option>)}</select></label>}
          {showCat && board === 'videos' && <label className="text-[13px]">분야 (그룹 제목)<input name="category" defaultValue={post?.category || ''} placeholder="예: 로봇 · Physical AI" className="input mt-1" /></label>}
          {showOrder && <label className="text-[13px]">정렬 순서 / 조 번호<input name="sort_order" type="number" defaultValue={post?.sort_order ?? 100} className="input mt-1" /><span className="block text-[11px] text-sg-steel mt-1">작을수록 앞에 표시 (창의적종합설계는 조 번호)</span></label>}
        </div>
      )}
      <label className="block text-[13px]">YouTube 주소 <span className="text-sg-steel">(선택 — 입력하면 본문 위에 영상이 표시되고, 카드 썸네일로도 사용)</span><input name="video_url" defaultValue={post?.video_url || ''} placeholder="https://youtu.be/xxxxx 또는 https://www.youtube.com/watch?v=xxxxx" className="input mt-1" /></label>
      <label className="block text-[13px]">제목 (한국어) *<input name="title_ko" required defaultValue={post?.title_ko} className="input mt-1 !text-base" /></label>
      <label className="block text-[13px]">Title (English)<input name="title_en" value={enTitle} onChange={(e) => setEnTitle(e.target.value)} className="input mt-1" placeholder="비워두면 저장 시 자동 번역(설정 시)" /></label>
      <div><p className="text-[13px] mb-1">본문 (한국어) <span className="text-sg-steel">— 워드처럼 입력하세요. 위 버튼으로 제목·목록·표·사진·링크를 넣을 수 있습니다.</span></p><RichEditor name="content_ko" defaultValue={post?.content_ko || ''} /></div>
      <details className="border border-sg-line bg-white p-3" open={!!post?.content_en}>
        <summary className="text-[13px] cursor-pointer">Content (English) — {post?.content_en ? '있음' : '없음 · 자동 번역 대상'}</summary>
        <div className="mt-3"><RichEditor name="content_en" defaultValue={post?.content_en || ''} minHeight={264} /></div>
      </details>
      <div className="flex flex-wrap gap-3 items-center">
        <TranslateButton pairs={[['title_ko', 'title_en'], ['content_ko', 'content_en']]} />
        <label className="text-[13px] flex items-center gap-2">영문 자동 번역
          <select name="translate_mode" defaultValue="changed" className="input !w-auto !py-1.5">
            <option value="changed">국문이 바뀌면 다시 번역 (권장)</option>
            <option value="missing">영문이 비어 있을 때만</option>
            <option value="none">번역하지 않음</option>
          </select>
        </label>
        <span className="text-[12px] text-sg-steel">영문 칸을 직접 고치면 그 항목은 자동 번역이 덮어쓰지 않습니다.</span>
      </div>
      <section className="grid gap-6 md:grid-cols-2">
        <div className="border border-sg-line bg-white p-4">
          <p className="text-[13px] font-semibold">대표 이미지 / 갤러리 사진</p>
          <div className="mt-2 flex flex-wrap gap-2">{images.map((im, i) => (
            <div key={i} className={`relative w-24 h-24 border ${thumb === im.url ? 'border-sg-red ring-2 ring-sg-red' : 'border-sg-line'}`}>
              <img src={im.url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setThumb(im.url)} className="absolute left-0 bottom-0 bg-white/90 text-[10px] px-1">대표</button>
              <button type="button" onClick={() => { setImages(images.filter((_, j) => j !== i)); if (thumb === im.url) setThumb(''); }} className="absolute right-0 top-0 bg-sg-red text-white text-[10px] px-1">×</button>
            </div>))}</div>
          <div className="mt-3"><Uploader folder="images" accept="image/*" multiple label="+ 사진 추가" onDone={(fs) => { const next = [...images, ...fs.map((f) => ({ url: f.url, caption: '' }))]; setImages(next); if (!thumb) setThumb(next[0].url); }} /></div>
        </div>
        <div className="border border-sg-line bg-white p-4">
          <p className="text-[13px] font-semibold">첨부파일</p>
          <ul className="mt-2 space-y-1 text-[13px]">{files.map((f, i) => <li key={i} className="flex justify-between gap-2"><a href={f.url} target="_blank" rel="noreferrer" className="truncate hover:text-sg-red">{f.name}</a><button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-sg-red">삭제</button></li>)}</ul>
          <div className="mt-3"><Uploader folder="files" multiple label="+ 파일 추가" onDone={(fs) => setFiles([...files, ...fs])} /></div>
        </div>
      </section>
      <div className="flex flex-wrap gap-5 text-[13px]">
        <label className="flex items-center gap-2"><input type="checkbox" name="is_pinned" defaultChecked={post?.is_pinned} /> 상단 고정(공지)</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="show_on_home" defaultChecked={post ? post.show_on_home : true} /> 메인 페이지에 노출</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={post ? post.published : true} /> 공개</label>
      </div>
      <div className="flex gap-3"><button className="btn-primary">저장</button></div>
    </form>
  );
}

export function DeletePostButton({ id, board }: { id: number; board: string }) {
  return <form action={deletePost} onSubmit={(e) => { if (!confirm('이 게시글을 삭제할까요? 30일 동안 휴지통(관리자 › 백업·휴지통)에 보관되어 복구할 수 있습니다.')) e.preventDefault(); }}><input type="hidden" name="id" value={id} /><input type="hidden" name="board" value={board} /><button className="text-[13px] text-sg-red underline">게시글 삭제</button></form>;
}
