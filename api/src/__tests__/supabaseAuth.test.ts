import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import {
  supabaseAuth,
  getRequiredUserId,
  HttpError,
} from "../middleware/supabaseAuth.js";

const JWT_SECRET = "test-secret-at-least-32-chars-long!";

// Factoria de objetos mock Express
function makeReq(overrides: Partial<Request> = {}): Request {
  return { headers: {}, ...overrides } as unknown as Request;
}
function makeMocks() {
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { res, next };
}

describe("HttpError", () => {
  it("tiene status y nombre correctos", () => {
    const err = new HttpError(404, "Not found");
    expect(err.status).toBe(404);
    expect(err.message).toBe("Not found");
    expect(err.name).toBe("HttpError");
    expect(err).toBeInstanceOf(Error);
  });
});

describe("supabaseAuth middleware", () => {
  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
  });

  it("llama next() con userId cuando el token es valido", () => {
    const token = jwt.sign({ sub: "user-abc-123" }, JWT_SECRET, {
      expiresIn: "1h",
    });
    const req = makeReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const { res, next } = makeMocks();

    supabaseAuth(req, res, next);

    expect(next).toHaveBeenCalledWith(); // sin argumentos = OK
    expect(req.userId).toBe("user-abc-123");
  });

  it("llama next(HttpError 401) cuando no hay header Authorization", () => {
    const req = makeReq({ headers: {} });
    const { res, next } = makeMocks();

    supabaseAuth(req, res, next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(401);
  });

  it("llama next(HttpError 401) cuando el token esta malformado", () => {
    const req = makeReq({
      headers: { authorization: "Bearer token-invalido" },
    });
    const { res, next } = makeMocks();

    supabaseAuth(req, res, next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(401);
  });

  it("llama next(HttpError 401) cuando el token esta expirado", () => {
    const token = jwt.sign({ sub: "user-xyz" }, JWT_SECRET, {
      expiresIn: -1, // ya expirado
    });
    const req = makeReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const { res, next } = makeMocks();

    supabaseAuth(req, res, next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(401);
  });

  it("llama next(Error) cuando SUPABASE_JWT_SECRET no esta configurado", () => {
    delete process.env.SUPABASE_JWT_SECRET;
    const token = jwt.sign({ sub: "u1" }, JWT_SECRET);
    const req = makeReq({
      headers: { authorization: `Bearer ${token}` },
    });
    const { res, next } = makeMocks();

    supabaseAuth(req, res, next);

    const err = (next as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(401);
  });
});

describe("getRequiredUserId", () => {
  it("retorna el userId si esta presente en req", () => {
    const req = makeReq();
    req.userId = "uuid-1234";
    expect(getRequiredUserId(req)).toBe("uuid-1234");
  });

  it("lanza HttpError 401 si userId esta ausente", () => {
    const req = makeReq();
    expect(() => getRequiredUserId(req)).toThrow(HttpError);
    expect(() => getRequiredUserId(req)).toThrowError(
      expect.objectContaining({ status: 401 }),
    );
  });
});
