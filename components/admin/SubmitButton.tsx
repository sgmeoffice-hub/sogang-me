'use client';
import { useFormStatus } from 'react-dom';

/** 서버 액션 폼 버튼 — 처리 중 표시·중복 클릭 방지, 필요하면 확인 창 */
export default function SubmitButton({ children, className = '', pendingText, confirm: ask }: { children: React.ReactNode; className?: string; pendingText?: string; confirm?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} onClick={(e) => { if (ask && !window.confirm(ask)) e.preventDefault(); }}>
      {pending ? pendingText || '…' : children}
    </button>
  );
}
