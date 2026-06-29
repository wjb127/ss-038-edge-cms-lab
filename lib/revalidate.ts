import { revalidatePath } from "next/cache";

// 발행/수정/삭제 시 공개 경로 캐시 무효화.
// OpenNext에서 tag cache가 구성되지 않은 환경에서는 revalidatePath가 throw할 수 있어
// 쓰기 트랜잭션이 깨지지 않도록 best-effort로 감싼다(시간기반 ISR이 폴백).
export function safeRevalidate(paths: string[]) {
  for (const path of paths) {
    try {
      revalidatePath(path);
    } catch {
      // tag cache 미구성 → 무시. revalidate TTL 만료 시 자연 갱신.
    }
  }
}
