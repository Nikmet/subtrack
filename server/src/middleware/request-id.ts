import type { NextFunction, Request, Response } from "express";
import { randomUUID } from "node:crypto";

export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incomingRequestId = req.headers["x-request-id"];
  const requestId =
    typeof incomingRequestId === "string" && incomingRequestId.trim().length > 0
      ? incomingRequestId
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
