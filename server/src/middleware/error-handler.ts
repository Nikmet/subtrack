import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env.js";
import { HttpError } from "../lib/http-error.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const httpError =
    error instanceof HttpError
      ? error
      : new HttpError(500, "Unexpected server error");

  logger.error(
    {
      requestId: req.requestId,
      path: req.originalUrl,
      method: req.method,
      err: error,
    },
    "request_failed",
  );

  res.status(httpError.statusCode).json({
    requestId: req.requestId,
    error: {
      message: httpError.message,
      details: httpError.details,
    },
    stack: env.nodeEnv === "production" ? undefined : httpError.stack,
  });
}
