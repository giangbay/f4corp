import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { execute, one } from "./database.js";

const scrypt = promisify(scryptCallback);
const SESSION_DURATION = 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = "moc_session";

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scrypt(password, salt, 64, { N: 16384 });
  return `scrypt$16384$${salt.toString("base64url")}$${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, cost, saltValue, keyValue] = storedHash.split("$");
  if (algorithm !== "scrypt" || cost !== "16384" || !saltValue || !keyValue) {
    return false;
  }

  const expectedKey = Buffer.from(keyValue, "base64url");
  const actualKey = await scrypt(
    password,
    Buffer.from(saltValue, "base64url"),
    expectedKey.length,
    { N: 16384 },
  );
  return timingSafeEqual(expectedKey, actualKey);
}

export function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function readSessionToken(request) {
  const cookies = request.headers.cookie?.split(";") ?? [];
  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    if (separator < 0) continue;
    if (cookie.slice(0, separator).trim() === SESSION_COOKIE) {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    }
  }
  return null;
}

export async function getSessionUser(token) {
  if (!token) return null;
  return await one(`
    SELECT users.id, users.name, users.email, users.role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `, [hashSessionToken(token), Date.now()]);
}

export async function createSession(userId) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DURATION;
  await execute(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    [hashSessionToken(token), userId, expiresAt],
  );
  return { token, expiresAt };
}

export async function requireAuth(request, response, next) {
  try {
    const token = readSessionToken(request);
    const user = await getSessionUser(token);
    if (!user) {
      response.status(401).json({ error: "Vui lòng đăng nhập để tiếp tục." });
      return;
    }
    request.sessionToken = token;
    request.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(request, response, next) {
  if (request.user?.role !== "admin") {
    response.status(403).json({ error: "Chức năng này chỉ dành cho quản trị viên." });
    return;
  }
  next();
}

export function requireStaffOrAdmin(request, response, next) {
  if (!["staff", "admin"].includes(request.user?.role)) {
    response.status(403).json({
      error: "Chức năng này chỉ dành cho nhân viên hoặc quản trị viên.",
    });
    return;
  }
  next();
}

export function sessionCookie(token, expiresAt, secure) {
  const maxAge = Math.max(0, expiresAt - Date.now());
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(maxAge / 1000)}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(secure) {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
}

export async function bootstrapAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email && !password) return;
  if (!email || !password || password.length < 14 || password.length > 128) {
    throw new Error(
      "ADMIN_EMAIL and ADMIN_PASSWORD must both be set; the password must be 14-128 characters.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  }

  const existingUser = await one(
    "SELECT id, role FROM users WHERE email = ?",
    [email],
  );
  if (existingUser) {
    if (existingUser.role !== "admin") {
      throw new Error("ADMIN_EMAIL is already assigned to a non-admin account.");
    }
    return;
  }

  const passwordHash = await hashPassword(password);
  await execute(`
    INSERT INTO users (name, email, role, password_hash)
    VALUES (?, ?, 'admin', ?)
  `, ["Quản trị viên", email, passwordHash]);
  console.log("Created the configured administrator account.");
}
