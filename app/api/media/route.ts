import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { bucket, db } from "@/lib/env";
import {
  ALLOWED_UPLOAD_TYPES,
  detectMimeByMagic,
  MAX_UPLOAD_BYTES,
  sameOrigin
} from "@/lib/security";
import { backWithError, canWrite, id, isFrameworkError } from "@/lib/util";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  if (!sameOrigin(request)) redirect(backWithError("/admin/media", "잘못된 요청 출처입니다."));
  const form = await request.formData();
  let target = "/admin/media";
  try {
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) throw new Error("파일이 필요합니다.");
    if (file.size > MAX_UPLOAD_BYTES) throw new Error(`파일이 너무 큽니다(최대 ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)}MB).`);

    // 클라가 보낸 file.type을 믿지 않고 실제 바이트로 타입 판별. SVG 등 스크립트성 포맷 차단.
    const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    const detected = detectMimeByMagic(head);
    if (!detected || !ALLOWED_UPLOAD_TYPES.includes(detected as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
      throw new Error("허용되지 않는 파일 형식입니다(PNG/JPEG/GIF/WEBP/PDF만 가능).");
    }

    const mediaId = id("med");
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const objectKey = `${mediaId}/${safeName}`;
    await bucket().put(objectKey, file.stream(), {
      // 저장 content-type은 클라 값이 아니라 검증된 detected를 사용
      httpMetadata: { contentType: detected },
      customMetadata: { uploadedBy: user.id }
    });
    await db()
      .prepare(
        "INSERT INTO media(id, object_key, url_path, filename, content_type, alt_text, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(mediaId, objectKey, `/media/${objectKey}`, file.name, detected, form.get("alt_text")?.toString() ?? "", file.size, user.id)
      .run();
    target = "/admin/media";
  } catch (error) {
    if (isFrameworkError(error)) throw error;
    target = backWithError("/admin/media", (error as Error).message || "업로드 실패");
  }
  redirect(target);
}
