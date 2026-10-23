import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/app-error.js";

type RequestTarget = "body" | "query" | "params";

export function validate(schema: ZodType, target: RequestTarget = "body") {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request[target]);
    if (!result.success) {
      next(new AppError(400, "VALIDATION_ERROR", "Request validation failed.", result.error.flatten()));
      return;
    }

    response.locals.validated ??= {};
    response.locals.validated[target] = result.data;
    if (target === "body") request.body = result.data;
    if (target === "params") request.params = result.data as Request["params"];
    next();
  };
}
