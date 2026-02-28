import type { NextFunction, Request, Response } from "express";

import { HttpError } from "../lib/http-error.js";
import { verifyAccessToken } from "../lib/jwt.js";

function extractBearerToken(authorizationHeader: string | undefined): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [type, token] = authorizationHeader.split(" ");
  if (type !== "Bearer" || !token) {
    return null;
  }

  return token;
}

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const tokenFromCookie = req.cookies?.access_token;
  const tokenFromHeader = extractBearerToken(req.header("authorization"));
  const token =
    typeof tokenFromCookie === "string" ? tokenFromCookie : tokenFromHeader;

  if (!token) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  const payload = verifyAccessToken(token);
  req.user = {
    id: payload.sub,
    role: payload.role,
  };

  next();
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(new HttpError(401, "Authentication required"));
    return;
  }

  if (req.user.role !== "ADMIN") {
    next(new HttpError(403, "Admin role required"));
    return;
  }

  next();
}
