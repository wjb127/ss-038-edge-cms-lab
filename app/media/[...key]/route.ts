import { notFound } from "next/navigation";
import { bucket } from "@/lib/env";

export async function GET(_: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const object = await bucket().get(key.join("/"));
  if (!object) notFound();
  return new Response(object.body, {
    headers: {
      "content-type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable"
    }
  });
}
