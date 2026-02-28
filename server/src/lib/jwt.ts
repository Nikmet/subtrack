import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { HttpError } from "./http-error.js";

export type UserRole = "USER" | "ADMIN";

export interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

function issueToken(
  payload: AuthTokenPayload,
  secret: string,
  expiresInSeconds: number,
): string {
  return jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: expiresInSeconds,
  });
}

function verifyToken(token: string, secret: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, secret);
    if (typeof decoded !== "object" || decoded === null) {
      throw new HttpError(401, "Invalid token payload");
    }

    const sub = typeof decoded.sub === "string" ? decoded.sub : "";
    const role = decoded.role === "ADMIN" ? "ADMIN" : "USER";

    if (!sub) {
      throw new HttpError(401, "Token subject is missing");
    }

    return { sub, role };
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
}

export function issueAccessToken(payload: AuthTokenPayload): string {
  return issueToken(
    payload,
    env.jwtAccessSecret,
    Math.floor(env.accessTokenTtlMs / 1000),
  );
}

export function issueRefreshToken(payload: AuthTokenPayload): string {
  return issueToken(
    payload,
    env.jwtRefreshSecret,
    Math.floor(env.refreshTokenTtlMs / 1000),
  );
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return verifyToken(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return verifyToken(token, env.jwtRefreshSecret);
}
