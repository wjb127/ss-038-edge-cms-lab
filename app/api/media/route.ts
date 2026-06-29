import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { bucket, db } from "@/lib/env";
import { canWrite, id } from "@/lib/util";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!canWrite(user.role)) redirect("/admin");
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("file is required");
  const mediaId = id("med");
  const objectKey = `${mediaId}/${file.name.replace(/[^\w.\-]+/g, "_")}`;
  await bucket().put(objectKey, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
    customMetadata: { uploadedBy: user.id }
  });
  await db()
    .prepare("INSERT INTO media(id, object_key, url_path, filename, content_type, alt_text, size, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind(mediaId, objectKey, `/media/${objectKey}`, file.name, file.type || "application/octet-stream", form.get("alt_text")?.toString() ?? "", file.size, user.id)
    .run();
  redirect("/admin/media");
}
