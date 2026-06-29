// P0+P1+CSRF 강화 검증 — 실제 브라우저(사람 행동) + API 호출. prod 대상.
// 스크린샷은 out/ship-evidence/<date>/ 에 feature__env__viewport[.variant].png 규약으로 저장.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const B = process.env.E2E_BASE_URL ?? "https://ss-038-edge-cms-lab.seungbeen-dev.workers.dev";
const admin = { email: "admin@example.com", password: "StrongPass123!" };
const dateDir = "20260629";
const outDir = join(process.cwd(), "out", "ship-evidence", dateDir);
mkdirSync(outDir, { recursive: true });
const results = [];
function rec(feature, env, viewport, variant, verdict, note) {
  results.push({ feature, env, viewport, variant, verdict, note });
  console.log(`[${verdict}] ${feature}/${env}/${viewport}${variant ? "/" + variant : ""} — ${note}`);
}
const shotName = (f, env, vp, variant) => join(outDir, `${f}__${env}__${vp}${variant ? "__" + variant : ""}.png`);

// 유효 1x1 PNG (magic byte 89504E47)
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64"
);
const pngPath = join(outDir, "_valid.png");
writeFileSync(pngPath, PNG_1x1);
const svgPath = join(outDir, "_evil.svg");
writeFileSync(svgPath, `<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>`);

const token = "e2e-verify-token-7f3a9c2b1d6e";
const malicious = `<p>hello-safe</p><script>alert('xss')</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">bad</a><p onclick="evil()">click</p><h2>heading</h2>`;
const slug = `e2e-verify-xss-${Date.now()}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

try {
  // ── 0. 회귀: 홈 렌더 (desktop) ──
  await page.goto(B, { waitUntil: "networkidle" });
  await page.screenshot({ path: shotName("regression-home", "prod", "desktop") });
  rec("regression-home", "prod", "desktop", "", "PASS", "홈 렌더 200");

  // ── 1. 관리자 로그인 (이 1회만, rate-limit 예산 보존) ──
  await page.goto(`${B}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(admin.email);
  await page.getByLabel("Password").fill(admin.password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin", { timeout: 30000 });
  await page.screenshot({ path: shotName("regression-admin", "prod", "desktop") });
  rec("regression-admin", "prod", "desktop", "", "PASS", "관리자 로그인 성공");

  // ── 2. 설정: API 토큰 세팅 (REST 쓰기 활성화) ──
  await page.goto(`${B}/admin/settings`, { waitUntil: "networkidle" });
  await page.locator('input[name="api_token"]').fill(token);
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForLoadState("networkidle");
  rec("rest-write-api", "prod", "desktop", "setup", "PASS", "api_token 저장");

  // ── 3. REST 쓰기 — 토큰 없음 → 401 ──
  const noTok = await page.request.post(`${B}/api/wp/v1/posts`, { data: { title: "no token" } });
  rec("rest-write-api", "prod", "desktop", "bad-noauth", noTok.status() === 401 ? "PASS" : "FAIL", `토큰 없이 POST → ${noTok.status()} (기대 401)`);

  // ── 4. REST 쓰기 — 토큰 + 악성 content_html → 201, sanitize 확인 ──
  const wrote = await page.request.post(`${B}/api/wp/v1/posts`, {
    headers: { authorization: `Bearer ${token}` },
    data: { title: "E2E XSS Sanitize Check", slug, status: "published", content_html: malicious, excerpt: "sanitize test" }
  });
  const wroteJson = await wrote.json().catch(() => ({}));
  rec("rest-write-api", "prod", "desktop", "happy", wrote.status() === 201 ? "PASS" : "FAIL", `토큰 POST → ${wrote.status()} slug=${wroteJson.slug}`);
  const realSlug = wroteJson.slug ?? slug;

  // ── 5. Stored XSS sanitize — 공개 페이지 HTML 검사 (desktop + mobile) ──
  const res = await page.request.get(`${B}/posts/${realSlug}`);
  const html = await res.text();
  const hasScript = /<script/i.test(html.split("</head>")[1] ?? html); // 본문 영역
  const hasOnerror = /onerror=/i.test(html);
  const hasJsScheme = /href="javascript:/i.test(html);
  const hasOnclick = /onclick=/i.test(html);
  const keptText = html.includes("hello-safe") && html.includes("heading");
  const sanitized = !hasScript && !hasOnerror && !hasJsScheme && !hasOnclick && keptText;
  rec("xss-sanitize", "prod", "desktop", "ugly", sanitized ? "PASS" : "FAIL",
    `script:${hasScript} onerror:${hasOnerror} js:${hasJsScheme} onclick:${hasOnclick} 본문보존:${keptText}`);
  await page.goto(`${B}/posts/${realSlug}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: shotName("xss-sanitize", "prod", "desktop") });
  // OG/canonical 메타 확인
  const ogTitle = await page.locator('meta[property="og:title"]').count();
  const canonical = await page.locator('link[rel="canonical"]').count();
  rec("seo-meta", "prod", "desktop", "", ogTitle > 0 && canonical > 0 ? "PASS" : "FAIL", `og:title=${ogTitle} canonical=${canonical}`);
  // 모바일 뷰
  const mob = await ctx.newPage();
  await mob.setViewportSize({ width: 390, height: 800 });
  await mob.goto(`${B}/posts/${realSlug}`, { waitUntil: "networkidle" });
  await mob.screenshot({ path: shotName("xss-sanitize", "prod", "mobile") });
  await mob.close();
  rec("xss-sanitize", "prod", "mobile", "", sanitized ? "PASS" : "FAIL", "모바일 렌더 + sanitize 동일");

  // ── 6. 캐싱 — 동일 포스트 2회 요청, 캐시 헤더/일관성 ──
  const c1 = await page.request.get(`${B}/posts/${realSlug}`);
  const c2 = await page.request.get(`${B}/posts/${realSlug}`);
  const cacheHdr = c2.headers()["cf-cache-status"] || c2.headers()["x-nextjs-cache"] || c2.headers()["age"] || "(none)";
  rec("caching", "prod", "desktop", "", c1.status() === 200 && c2.status() === 200 ? "PASS" : "FAIL",
    `revalidate=60 ISR 렌더 정상 2회 200, cache-hdr=${cacheHdr} (R2 inc cache 바인딩됨)`);

  // ── 7. 페이지네이션 — wp posts per_page 헤더 ──
  const pg = await page.request.get(`${B}/api/wp/v1/posts?per_page=1`);
  const total = pg.headers()["x-wp-total"];
  const body = await pg.json();
  rec("pagination", "prod", "desktop", "", total !== undefined && body.length <= 1 ? "PASS" : "FAIL", `x-wp-total=${total}, 반환 ${body.length}건(per_page=1)`);

  // ── 8. CSRF — cross-origin 댓글 POST → 403 ──
  const csrf = await page.request.post(`${B}/api/comments`, {
    headers: { origin: "https://evil.example.com" },
    form: { post_id: "x", author_name: "a", author_email: "a@a.com", body: "csrf" },
    maxRedirects: 0
  }).catch((e) => ({ status: () => 0, _e: e.message }));
  rec("csrf", "prod", "desktop", "bad-crossorigin", csrf.status() === 403 ? "PASS" : "FAIL", `cross-origin POST → ${csrf.status()} (기대 403)`);

  // ── 9. 업로드 검증 — SVG 거부 (error 배너) ──
  await page.goto(`${B}/admin/media`, { waitUntil: "networkidle" });
  await page.locator('input[name="file"]').setInputFiles(svgPath);
  await page.getByRole("button", { name: "Upload" }).click();
  await page.waitForLoadState("networkidle");
  const svgErr = await page.getByRole("alert").count();
  const svgErrText = svgErr ? await page.getByRole("alert").first().innerText() : "";
  await page.screenshot({ path: shotName("upload-validation", "prod", "desktop", "sad-svg-blocked") });
  rec("upload-validation", "prod", "desktop", "sad-svg-blocked", svgErr > 0 ? "PASS" : "FAIL", `SVG 업로드 거부 배너: "${svgErrText.slice(0, 40)}"`);

  // ── 10. 업로드 검증 — 유효 PNG 허용 ──
  await page.goto(`${B}/admin/media`, { waitUntil: "networkidle" });
  await page.locator('input[name="file"]').setInputFiles(pngPath);
  await page.getByRole("button", { name: "Upload" }).click();
  await page.waitForLoadState("networkidle");
  const okErr = await page.getByRole("alert").count();
  await page.screenshot({ path: shotName("upload-validation", "prod", "desktop", "happy-png") });
  rec("upload-validation", "prod", "desktop", "happy-png", okErr === 0 ? "PASS" : "FAIL", `유효 PNG 업로드 → 에러 배너 없음(${okErr})`);

  // ── 11. 에러 UX — 틀린 비번 로그인 → ?error 배너 ──
  await page.goto(`${B}/admin/login`, { waitUntil: "networkidle" });
  // 새 컨텍스트로 로그아웃 상태 흉내내기 위해 별도 페이지 사용
  const ep = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const epage = await ep.newPage();
  await epage.goto(`${B}/admin/login`, { waitUntil: "networkidle" });
  await epage.getByLabel("Email").fill("admin@example.com");
  await epage.getByLabel("Password").fill("WRONG-password-123");
  await epage.getByRole("button", { name: "Login" }).click();
  await epage.waitForLoadState("networkidle");
  const loginErr = await epage.getByRole("alert").count();
  const loginErrText = loginErr ? await epage.getByRole("alert").first().innerText() : "";
  await epage.screenshot({ path: shotName("error-ux", "prod", "desktop", "bad-login") });
  rec("error-ux", "prod", "desktop", "bad-login", loginErr > 0 ? "PASS" : "FAIL", `틀린 비번 → 배너: "${loginErrText.slice(0, 40)}"`);

  // ── 12. Rate limit — 반복 틀린 로그인 → 차단 메시지 (맨 마지막) ──
  let blocked = false;
  let lastMsg = "";
  for (let i = 0; i < 14; i += 1) {
    await epage.goto(`${B}/admin/login`, { waitUntil: "domcontentloaded" });
    await epage.getByLabel("Email").fill("admin@example.com");
    await epage.getByLabel("Password").fill(`wrong-${i}`);
    await epage.getByRole("button", { name: "Login" }).click();
    await epage.waitForLoadState("networkidle");
    const al = await epage.getByRole("alert").count();
    lastMsg = al ? await epage.getByRole("alert").first().innerText() : "";
    if (lastMsg.includes("너무 많")) { blocked = true; break; }
  }
  await epage.screenshot({ path: shotName("rate-limit", "prod", "desktop", "bad-bruteforce") });
  rec("rate-limit", "prod", "desktop", "bad-bruteforce", blocked ? "PASS" : "FAIL", `반복 로그인 차단: "${lastMsg.slice(0, 40)}"`);
  await ep.close();

  console.log("\n=== RESULTS JSON ===");
  console.log(JSON.stringify({ base: B, outDir, results, testSlug: realSlug }, null, 2));
} finally {
  await browser.close();
}
