import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const baseUrl = process.env.E2E_BASE_URL ?? "https://ss-038-edge-cms-lab.seungbeen-dev.workers.dev";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const artifactDir = join(process.cwd(), "e2e-artifacts", stamp);
mkdirSync(artifactDir, { recursive: true });

const admin = {
  name: "Admin User",
  email: "admin@example.com",
  password: "StrongPass123!"
};
const subscriber = {
  name: "Subscriber User",
  email: `subscriber-${stamp}@example.com`,
  password: "StrongPass123!"
};
const postSlug = `edge-post-${stamp.toLowerCase()}`;
const pageSlug = `edge-page-${stamp.toLowerCase()}`;
const imagePath = join(artifactDir, "sample.svg");
writeFileSync(
  imagePath,
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#126d57"/><circle cx="160" cy="180" r="82" fill="#f2c94c"/><text x="280" y="194" font-family="Arial" font-size="42" font-weight="700" fill="white">R2 Media</text></svg>`
);

async function shot(page, name) {
  const path = join(artifactDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true });
  return path;
}

async function login(page, email, password) {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await page.waitForURL("**/admin", { timeout: 30000 });
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const evidence = [];

try {
  await page.goto(`${baseUrl}/admin`, { waitUntil: "networkidle" });
  if (page.url().includes("/admin/setup")) {
    await page.getByLabel("Name").fill(admin.name);
    await page.getByLabel("Email").fill(admin.email);
    await page.getByLabel("Password").fill(admin.password);
    await page.getByRole("button", { name: "Create admin" }).click();
    await page.waitForURL("**/admin", { timeout: 30000 });
  } else if (page.url().includes("/admin/login")) {
    await login(page, admin.email, admin.password);
  }
  evidence.push(["admin-dashboard", await shot(page, "01-admin-dashboard")]);

  await page.goto(`${baseUrl}/admin/users`, { waitUntil: "networkidle" });
  await page.locator('form[action="/api/users"] input[name="name"]').fill(subscriber.name);
  await page.locator('form[action="/api/users"] input[name="email"]').fill(subscriber.email);
  await page.locator('form[action="/api/users"] input[name="password"]').fill(subscriber.password);
  await page.locator('form[action="/api/users"] select[name="role"]').selectOption("subscriber");
  await page.locator('form[action="/api/users"]').getByRole("button", { name: "Add" }).click();
  await page.waitForLoadState("networkidle");
  evidence.push(["users", await shot(page, "02-users")]);

  await page.goto(`${baseUrl}/admin/content-types`, { waitUntil: "networkidle" });
  await page.locator('form[action="/api/content-types"] input[name="slug"]').fill(`case-${stamp.toLowerCase()}`);
  await page.locator('form[action="/api/content-types"] input[name="label"]').fill("Case Studies");
  await page.locator('form[action="/api/content-types"]').getByRole("button", { name: "Add" }).click();
  await page.waitForLoadState("networkidle");
  evidence.push(["content-types", await shot(page, "03-content-types")]);

  await page.goto(`${baseUrl}/admin/taxonomies`, { waitUntil: "networkidle" });
  await page.locator('form[action="/api/taxonomies"] input[name="slug"]').fill(`topic-${stamp.toLowerCase()}`);
  await page.locator('form[action="/api/taxonomies"] input[name="label"]').fill("Topics");
  await page.locator('form[action="/api/taxonomies"] select[name="content_type"]').selectOption("post");
  await page.locator('form[action="/api/taxonomies"]').getByRole("button", { name: "Add" }).click();
  await page.waitForLoadState("networkidle");
  await page.goto(`${baseUrl}/admin/taxonomies`, { waitUntil: "networkidle" });
  const termForm = page.locator('form[action="/api/terms"]').first();
  await termForm.locator('input[name="name"]').fill("Launch Notes");
  await termForm.locator('input[name="slug"]').fill(`launch-${stamp.toLowerCase()}`);
  await termForm.getByRole("button", { name: "Add term" }).click();
  await page.waitForLoadState("networkidle");
  evidence.push(["taxonomies-terms", await shot(page, "04-taxonomies-terms")]);

  await page.goto(`${baseUrl}/admin/media`, { waitUntil: "networkidle" });
  await page.locator('input[name="file"]').setInputFiles(imagePath);
  await page.locator('input[name="alt_text"]').first().fill("Green sample image");
  await page.getByRole("button", { name: "Upload" }).click();
  await page.waitForLoadState("networkidle");
  evidence.push(["media-upload", await shot(page, "05-media-upload")]);

  await page.goto(`${baseUrl}/admin/content/new?type=post`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill("Edge CMS Published Post");
  await page.getByLabel("Slug").fill(postSlug);
  await page.getByLabel("Excerpt").fill("Published post created by live E2E.");
  await page.getByLabel("Status").selectOption("published");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("This post was created through the admin editor.");
  await page.getByLabel("Insert image").selectOption({ label: "sample.svg" });
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("**/admin/content/**", { timeout: 30000 });
  evidence.push(["post-created", await shot(page, "06-post-created")]);

  await page.goto(`${baseUrl}/posts/${postSlug}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Edge CMS Published Post" }).waitFor();
  await page.getByAltText("Green sample image").waitFor();
  evidence.push(["public-post", await shot(page, "07-public-post")]);

  await page.getByLabel("Name").fill("Reader");
  await page.getByLabel("Email").fill("reader@example.com");
  await page.getByLabel("Comment").fill("This comment is pending approval.");
  await page.getByRole("button", { name: "Submit comment" }).click();
  await page.waitForURL(`**/posts/${postSlug}`, { timeout: 30000 });

  await page.goto(`${baseUrl}/admin/comments`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Approve" }).first().click();
  await page.waitForLoadState("networkidle");
  evidence.push(["comment-approved", await shot(page, "08-comment-approved")]);

  await page.goto(`${baseUrl}/posts/${postSlug}`, { waitUntil: "networkidle" });
  await page.getByText("This comment is pending approval.").waitFor();
  evidence.push(["comment-public", await shot(page, "09-comment-public")]);

  await page.goto(`${baseUrl}/admin/content/new?type=page`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill("Edge CMS Page");
  await page.getByLabel("Slug").fill(pageSlug);
  await page.getByLabel("Status").selectOption("published");
  await page.locator(".ProseMirror").click();
  await page.keyboard.type("This page was published through the CMS.");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForURL("**/admin/content/**", { timeout: 30000 });
  await page.goto(`${baseUrl}/${pageSlug}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Edge CMS Page" }).waitFor();
  evidence.push(["page-public", await shot(page, "10-page-public")]);

  const apiPosts = await (await page.request.get(`${baseUrl}/api/wp/v1/posts`)).json();
  if (!apiPosts.some((entry) => entry.slug === postSlug)) throw new Error("REST posts endpoint did not return created post");
  evidence.push(["rest-posts", JSON.stringify(apiPosts.find((entry) => entry.slug === postSlug))]);

  await page.goto(`${baseUrl}/admin/content?type=post`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Edit" }).first().click();
  await page.getByLabel("Title").fill("Edge CMS Published Post Updated");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForLoadState("networkidle");
  evidence.push(["post-updated", await shot(page, "11-post-updated")]);

  await page.goto(`${baseUrl}/admin/content?type=post`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Edit" }).first().click();
  await page.getByRole("button", { name: "Delete" }).click();
  await page.waitForURL("**/admin/content?type=post", { timeout: 30000 });
  evidence.push(["post-deleted", await shot(page, "12-post-deleted")]);

  await page.goto(`${baseUrl}/admin/media`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Delete" }).first().click();
  await page.waitForLoadState("networkidle");
  evidence.push(["media-deleted", await shot(page, "13-media-deleted")]);

  await page.goto(`${baseUrl}/admin/settings`, { waitUntil: "networkidle" });
  await page.getByLabel("Site title").fill("Edge CMS Lab Verified");
  await page.getByRole("button", { name: "Save" }).click();
  await page.waitForLoadState("networkidle");
  evidence.push(["settings", await shot(page, "14-settings")]);

  await page.locator('form[action="/api/auth/logout"]').getByRole("button", { name: "Logout" }).click();
  await page.waitForURL("**/admin/login", { timeout: 30000 });
  await login(page, subscriber.email, subscriber.password);
  await page.goto(`${baseUrl}/admin/content?type=post`, { waitUntil: "networkidle" });
  await page.getByText("Access blocked").waitFor();
  evidence.push(["subscriber-blocked", await shot(page, "15-subscriber-blocked")]);

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  evidence.push(["home-200", await shot(page, "16-home")]);

  console.log(JSON.stringify({ baseUrl, artifactDir, evidence }, null, 2));
} finally {
  await browser.close();
}
