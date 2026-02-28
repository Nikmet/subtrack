import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";

import { HttpError } from "../lib/http-error.js";

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new HttpError(400, "Validation failed", error.issues));
        return;
      }

      next(error);
    }
  };
}
