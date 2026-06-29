import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

// ISR/revalidate 캐시 저장소: R2(영구) + regional cache(엣지 근접 단기 캐시).
// 공개 페이지의 revalidate=60 이 실제로 동작해 방문마다 D1를 때리지 않게 한다.
// 바인딩: NEXT_INC_CACHE_R2_BUCKET (wrangler.jsonc 참조)
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" })
});
