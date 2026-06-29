"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto grid min-h-screen max-w-md place-items-center gap-4 px-5 text-center">
      <div className="panel grid gap-3 p-6">
        <h1 className="text-2xl font-semibold">문제가 발생했습니다</h1>
        <p className="text-[#66706a]">요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        <button className="btn primary" onClick={() => reset()}>
          다시 시도
        </button>
      </div>
    </main>
  );
}
