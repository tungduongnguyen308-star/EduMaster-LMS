import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_EXPIRES_IN = "15m" as const;
const REFRESH_TOKEN_DAYS = 7;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET phai co it nhat 32 byte. Hay tao khoa ngau nhien trong .env.");
  }
  return secret;
}

export function generateAccessToken(userId: number): string {
  return jwt.sign({}, jwtSecret(), {
    algorithm: "HS256",
    subject: String(userId),
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    issuer: "edumaster-lms",
    audience: "edumaster-api",
  });
}

export function verifyAccessToken(token: string): number {
  const payload = jwt.verify(token, jwtSecret(), {
    algorithms: ["HS256"],
    issuer: "edumaster-lms",
    audience: "edumaster-api",
  });
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Token payload khong hop le");
  }
  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error("Token subject khong hop le");
  }
  return userId;
}

export function createRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiresAt(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
}
