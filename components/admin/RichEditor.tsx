'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { useEffect, useState } from 'react';

/** 글자 색 프리셋 (2026-09-17 박현주 선생님 요청: 글자 색·정렬 기능). 첫 항목은 '기본색으로' */
/** 정렬 버튼 아이콘 (가로줄 4개, 짧은 줄의 위치로 좌·중·우 표시) */
function AlignIcon({ a }: { a: 'left' | 'center' | 'right' }) {
  const short = (y: number) => a === 'left' ? <line x1="2" x2="10" y1={y} y2={y} /> : a === 'center' ? <line x1="4" x2="12" y1={y} y2={y} /> : <line x1="6" x2="14" y1={y} y2={y} />;
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <line x1="2" x2="14" y1="2" y2="2" />{short(5.5)}<line x1="2" x2="14" y1="9" y2="9" />{short(12.5)}
    </svg>
  );
}
const COLORS: [string, string][] =[['기본', ''], ['빨강', '#AF272F'], ['파랑', '#1d4ed8'], ['초록', '#15803d'], ['주황', '#c2410c'], ['회색', '#6b7280']];
import { uploadToMedia } from './Uploader';

/**
 * 워드처럼 쓰는 본문 편집기. 화면에 보이는 그대로 저장되며, HTML을 몰라도 됩니다.
 * (HTML을 직접 손봐야 할 때만 "HTML 편집" 탭 사용)
 */
export default function RichEditor({ name, defaultValue = '', folder = 'posts', minHeight = 320 }: { name: string; defaultValue?: string; folder?: string; minHeight?: number }) {
  const [html, setHtml] = useState(defaultValue);
  const [mode, setMode] = useState<'rich' | 'html'>('rich');
  const [busy, setBusy] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { target: '_blank', rel: 'noreferrer' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full h-auto' } }),
      Table.configure({ resizable: false }), TableRow, TableHeader, TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle, Color,
    ],
    content: defaultValue || '',
    editorProps: { attributes: { class: 'prose-sg focus:outline-none px-4 py-3', style: `min-height:${minHeight}px` } },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  // HTML 편집 탭에서 고친 내용을 일반 편집으로 돌아올 때 에디터에 반영한다 (수정분 유실 방지)
  const toggleMode = () => {
    if (mode === 'html' && editor) editor.commands.setContent(html || '', false);
    setMode(mode === 'rich' ? 'html' : 'rich');
  };

  // AI 번역 버튼 등 외부에서 값을 주입할 때: 'sg-editor-set' 이벤트로 state와 에디터를 함께 갱신
  useEffect(() => {
    const onSet = (e: Event) => {
      const d = (e as CustomEvent).detail as { name: string; value: string };
      if (d?.name !== name) return;
      setHtml(d.value);
      editor?.commands.setContent(d.value || '', false);
    };
    window.addEventListener('sg-editor-set', onSet);
    return () => window.removeEventListener('sg-editor-set', onSet);
  }, [editor, name]);

  const B = ({ on, active, title, children }: any) => (
    <button type="button" onMouseDown={(e) => { e.preventDefault(); on(); }} title={title}
      className={`px-2.5 py-1.5 text-[13px] border ${active ? 'bg-sg-ink text-white border-sg-ink' : 'bg-white border-sg-line hover:border-sg-ink'}`}>{children}</button>
  );

  async function pickImage() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []); if (!files.length) return;
      setBusy(true);
      try { for (const f of files) { const up = await uploadToMedia(f, folder); editor?.chain().focus().setImage({ src: up.url }).run(); } }
      catch (e: any) { alert(e.message || '업로드 실패'); }
      setBusy(false);
    };
    input.click();
  }

  return (
    <div className="border border-sg-line bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-sg-line bg-sg-mist">
        {mode === 'rich' && editor && (
          <>
            <B on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게"><b>가</b></B>
            <B on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임"><i>가</i></B>
            <B on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄"><u>가</u></B>
            <span className="w-px h-5 bg-sg-line mx-1" />
            {/* 글자 색: 프리셋 + 직접 고르기 */}
            <span className="inline-flex items-center gap-0.5" title="글자 색">
              {COLORS.map(([label, c]) => (
                <button key={label} type="button" title={c ? `글자 색: ${label}` : '기본 색으로'}
                  onMouseDown={(e) => { e.preventDefault(); c ? editor.chain().focus().setColor(c).run() : editor.chain().focus().unsetColor().run(); }}
                  className={`w-6 h-6 border grid place-items-center text-[12px] font-bold ${editor.isActive('textStyle', { color: c }) && c ? 'ring-2 ring-sg-ink' : ''} ${c ? 'border-sg-line' : 'border-sg-line bg-white'}`}
                  style={c ? { backgroundColor: c, color: '#fff' } : { color: '#2b2b2b' }}>가</button>
              ))}
              <input type="color" title="다른 색 고르기" aria-label="다른 색 고르기" className="w-6 h-6 p-0 border border-sg-line bg-white cursor-pointer"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
            </span>
            <span className="w-px h-5 bg-sg-line mx-1" />
            <B on={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬"><AlignIcon a="left" /></B>
            <B on={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬"><AlignIcon a="center" /></B>
            <B on={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬"><AlignIcon a="right" /></B>
            <span className="w-px h-5 bg-sg-line mx-1" />
            <B on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="큰 제목">제목1</B>
            <B on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="중간 제목">제목2</B>
            <B on={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="본문">본문</B>
            <span className="w-px h-5 bg-sg-line mx-1" />
            <B on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="글머리 기호">• 목록</B>
            <B on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 매기기">1. 목록</B>
            <span className="w-px h-5 bg-sg-line mx-1" />
            <B on={() => { const url = prompt('링크 주소 (http로 시작)'); if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run(); }} active={editor.isActive('link')} title="링크">🔗 링크</B>
            <B on={pickImage} title="사진 넣기">{busy ? '업로드 중…' : '🖼 사진'}</B>
            <span className="w-px h-5 bg-sg-line mx-1" />
            <B on={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="표 넣기">표 삽입</B>
            {editor.isActive('table') && (<>
              <B on={() => editor.chain().focus().addRowAfter().run()} title="행 추가">행+</B>
              <B on={() => editor.chain().focus().deleteRow().run()} title="행 삭제">행−</B>
              <B on={() => editor.chain().focus().addColumnAfter().run()} title="열 추가">열+</B>
              <B on={() => editor.chain().focus().deleteColumn().run()} title="열 삭제">열−</B>
              <B on={() => editor.chain().focus().deleteTable().run()} title="표 삭제">표 삭제</B>
            </>)}
            <span className="w-px h-5 bg-sg-line mx-1" />
            <B on={() => editor.chain().focus().undo().run()} title="되돌리기">↺</B>
            <B on={() => editor.chain().focus().redo().run()} title="다시 실행">↻</B>
          </>
        )}
        <span className="flex-1" />
        <button type="button" onClick={toggleMode} className="px-2.5 py-1.5 text-[12px] border border-sg-line bg-white">
          {mode === 'rich' ? 'HTML 편집' : '일반 편집으로'}
        </button>
      </div>

      {mode === 'rich'
        ? <EditorContent editor={editor} />
        : <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={16} className="w-full p-3 font-mono text-[13px] outline-none" spellCheck={false} />}

      {/* 실제 저장되는 값 */}
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
