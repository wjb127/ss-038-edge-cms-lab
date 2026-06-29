import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CloudflareEnv } from "@/lib/types";

export function env(): CloudflareEnv {
  return getCloudflareContext().env as CloudflareEnv;
}

export function db(): D1Database {
  return env().DB;
}

export function bucket(): R2Bucket {
  return env().MEDIA_BUCKET;
}
