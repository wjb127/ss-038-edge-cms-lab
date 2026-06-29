import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/env";
import { id } from "@/lib/util";
import type { Role, User } from "@/lib/types";

const sessionCookie = "edge_cms_session";

function bytesToBase64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function base64ToBytes(value: string) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

export async function hashPassword(password: string, salt = crypto.randomUUID()) {
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return `${salt}:${bytesToBase64(bits)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, encoded] = stored.split(":");
  if (!salt || !encoded) return false;
  const candidate = await hashPassword(password, salt);
  const candidateBytes = base64ToBytes(candidate.split(":")[1]);
  const storedBytes = base64ToBytes(encoded);
  if (candidateBytes.length !== storedBytes.length) return false;
  let diff = 0;
  for (let index = 0; index < candidateBytes.length; index += 1) {
    diff |= candidateBytes[index] ^ storedBytes[index];
  }
  return diff === 0;
}

export async function userCount() {
  const row = await db().prepare("SELECT COUNT(*) AS count FROM users").first<{ count: number }>();
  return row?.count ?? 0;
}

export async function createUser(input: { email: string; name: string; password: string; role: Role }) {
  const passwordHash = await hashPassword(input.password);
  const userId = id("usr");
  await db()
    .prepare("INSERT INTO users(id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)")
    .bind(userId, input.email.toLowerCase(), input.name, passwordHash, input.role)
    .run();
  return userId;
}

export async function createSession(userId: string) {
  const sessionId = id("ses");
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  await db().prepare("INSERT INTO sessions(id, user_id, expires_at) VALUES (?, ?, ?)").bind(sessionId, userId, expires).run();
  const jar = await cookies();
  jar.set(sessionCookie, sessionId, { httpOnly: true, sameSite: "lax", secure: true, path: "/", expires: new Date(expires) });
}

export async function getUser() {
  const jar = await cookies();
  const sessionId = jar.get(sessionCookie)?.value;
  if (!sessionId) return null;
  const user = await db()
    .prepare(
      "SELECT users.id, users.email, users.name, users.role, users.created_at FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.id = ? AND sessions.expires_at > ?"
    )
    .bind(sessionId, new Date().toISOString())
    .first<User>();
  return user ?? null;
}

export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function logout() {
  const jar = await cookies();
  const sessionId = jar.get(sessionCookie)?.value;
  if (sessionId) await db().prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
  jar.delete(sessionCookie);
}
