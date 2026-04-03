import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

// ── Express Request augmentation ──────────────────────────────────────────────
// Adds `userId` (Supabase auth.uid()) to every authenticated request.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// ── Typed HTTP error ───────────────────────────────────────────────────────────
// Used by the global error handler in index.ts to map to the correct HTTP status.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// ── supabaseAuth middleware ───────────────────────────────────────────────────
// Verifies the Supabase JWT locally using SUPABASE_JWT_SECRET (HS256).
// No network call — low latency, scales well.
//
// Setup checklist (supabase auth security audit):
//   [x] JWT verified with SUPABASE_JWT_SECRET from project Settings → API
//   [x] exp claim validated automatically by jsonwebtoken
//   [x] userId is extracted from standard `sub` claim (Supabase auth.uid())
//   [x] Token revocation is handled at the Supabase level (signOut invalidates)
//   [x] No sensitive data is logged
export function supabaseAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    next(new HttpError(401, "Unauthorized"));
    return;
  }

  try {
    const secret = process.env.SUPABASE_JWT_SECRET;
    if (!secret) throw new Error("SUPABASE_JWT_SECRET not configured");

    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    req.userId = payload.sub;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}

// ── getRequiredUserId ─────────────────────────────────────────────────────────
// Type-safe accessor for the userId set by supabaseAuth.
// Throws 401 if called outside an authenticated context (runtime safeguard).
export function getRequiredUserId(req: Request): string {
  if (!req.userId) throw new HttpError(401, "Unauthorized");
  return req.userId;
}
