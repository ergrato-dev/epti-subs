import { getAuth } from "@clerk/express";
import type { Request } from "express";

// Typed HTTP error used by the global error handler in index.ts
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// Type-safe helper: extracts userId after requireAuth() has run on the route.
// Throws HttpError(401) if called outside an authenticated context (should not
// happen in practice, but keeps TypeScript happy and provides runtime safety).
export function getRequiredUserId(req: Request): string {
  const { userId } = getAuth(req);
  if (!userId) throw new HttpError(401, "Unauthorized");
  return userId;
}
