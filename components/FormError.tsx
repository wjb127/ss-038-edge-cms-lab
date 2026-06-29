// 라우트가 ?error=메시지 로 되돌려보낸 검증 실패를 폼 상단에 표시.
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border px-3 py-2 text-sm"
      style={{ borderColor: "#e8caca", background: "#fbf1f1", color: "var(--danger)" }}
    >
      {message}
    </p>
  );
}
