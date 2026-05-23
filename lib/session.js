import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "sessao_usuario";
const SESSION_SECRET = process.env.SESSION_SECRET || "troque-este-segredo-em-producao";

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

export function createSessionValue(userId) {
  const payload = JSON.stringify({ userId, createdAt: Date.now() });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSessionValue(value) {
  if (!value) return null;

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature || sign(encodedPayload) !== signature) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function setUserSession(userId) {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, createSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getUserSession() {
  const cookieStore = await cookies();
  return readSessionValue(cookieStore.get(COOKIE_NAME)?.value);
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
