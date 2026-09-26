import Link from '@/components/Link';
export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="h-display mt-3">페이지를 찾을 수 없습니다</h1>
        <p className="mt-3 text-sg-steel">The page you requested does not exist.</p>
        <Link href="/" className="btn-primary mt-8">홈으로 / Home</Link>
      </div>
    </main>
  );
}
