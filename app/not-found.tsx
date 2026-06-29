import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center gap-4 px-5 text-center">
      <div className="panel grid gap-3 p-6">
        <h1 className="text-2xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="text-[#66706a]">요청하신 페이지가 존재하지 않거나 비공개 상태입니다.</p>
        <Link className="btn primary" href="/">
          홈으로
        </Link>
      </div>
    </main>
  );
}
