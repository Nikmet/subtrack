import type { CookieOptions } from "express";

import { env } from "./env.js";

function baseCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export const cookieConfig = {
  accessToken: baseCookieOptions(env.accessTokenTtlMs),
  refreshToken: baseCookieOptions(env.refreshTokenTtlMs),
};
