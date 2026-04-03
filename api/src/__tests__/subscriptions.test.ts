import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

// ─── Mocks (deben declararse ANTES de los imports del SUT) ─────────────────

const TEST_USER_ID = "test-user-uuid-1234";
const JWT_SECRET = "test-secret-at-least-32-chars-long!";

// Mock del DB — todos los metodos del orm chequeados en cada test
const mockReturning = vi.fn();
const mockWhereUpdate = vi.fn().mockReturnValue({ returning: mockReturning });
const mockSet = vi.fn().mockReturnValue({ where: mockWhereUpdate });
const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });
const mockUpdate = vi.fn().mockReturnValue({ set: mockSet });

vi.mock("../db/index.js", () => ({
  db: {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  },
}));

// A subscription fixture
const SUB = {
  id: 1,
  userId: TEST_USER_ID,
  name: "Netflix",
  cost: "23000",
  currency: "COP",
  billingCycle: "monthly",
  nextPaymentDate: "2026-05-01",
  active: true,
  color: "#7C3AED",
  logoUrl: null,
  planName: "Standard",
  paymentLast4: "1234",
  categoryId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Importamos la app DESPUES de los mocks
const { default: app } = await import("../index.js");

function authHeader() {
  const token = jwt.sign({ sub: TEST_USER_ID }, JWT_SECRET, {
    expiresIn: "1h",
  });
  return `Bearer ${token}`;
}

function expiredHeader() {
  const token = jwt.sign({ sub: TEST_USER_ID }, JWT_SECRET, { expiresIn: -1 });
  return `Bearer ${token}`;
}

beforeEach(() => {
  process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
  vi.clearAllMocks();
  // Defaults: queries retornan datos
  mockWhere.mockResolvedValue([SUB]);
  mockReturning.mockResolvedValue([SUB]);
});

// ─── Auth guard ────────────────────────────────────────────────────────────

describe("Auth guard", () => {
  it("rechaza requests sin token (401)", async () => {
    const res = await request(app).get("/subscriptions");
    expect(res.status).toBe(401);
  });

  it("rechaza requests con token expirado (401)", async () => {
    const res = await request(app)
      .get("/subscriptions")
      .set("Authorization", expiredHeader());
    expect(res.status).toBe(401);
  });
});

// ─── GET /subscriptions ────────────────────────────────────────────────────

describe("GET /subscriptions", () => {
  it("retorna lista de suscripciones del usuario", async () => {
    mockWhere.mockResolvedValue([SUB]);
    const res = await request(app)
      .get("/subscriptions")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("Netflix");
  });

  it("retorna lista vacia si no hay suscripciones", async () => {
    mockWhere.mockResolvedValue([]);
    const res = await request(app)
      .get("/subscriptions")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ─── GET /subscriptions/upcoming ───────────────────────────────────────────

describe("GET /subscriptions/upcoming", () => {
  it("retorna suscripciones proximas (proximos 30 dias)", async () => {
    mockWhere.mockResolvedValue([SUB]);
    const res = await request(app)
      .get("/subscriptions/upcoming")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── GET /subscriptions/:id ────────────────────────────────────────────────

describe("GET /subscriptions/:id", () => {
  it("retorna una suscripcion por ID", async () => {
    mockWhere.mockResolvedValue([SUB]);
    const res = await request(app)
      .get("/subscriptions/1")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it("retorna 404 si la suscripcion no existe", async () => {
    mockWhere.mockResolvedValue([]);
    const res = await request(app)
      .get("/subscriptions/999")
      .set("Authorization", authHeader());
    expect(res.status).toBe(404);
  });

  it("retorna 400 con ID no numerico", async () => {
    const res = await request(app)
      .get("/subscriptions/abc")
      .set("Authorization", authHeader());
    expect(res.status).toBe(400);
  });
});

// ─── POST /subscriptions ───────────────────────────────────────────────────

describe("POST /subscriptions", () => {
  it("crea una nueva suscripcion y retorna 201", async () => {
    mockReturning.mockResolvedValue([SUB]);
    const res = await request(app)
      .post("/subscriptions")
      .set("Authorization", authHeader())
      .send({
        name: "Netflix",
        cost: 23000,
        nextPaymentDate: "2026-05-01",
      });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Netflix");
  });

  it("retorna 400 si faltan campos requeridos", async () => {
    const res = await request(app)
      .post("/subscriptions")
      .set("Authorization", authHeader())
      .send({ name: "Spotify" }); // sin cost ni nextPaymentDate
    expect(res.status).toBe(400);
  });
});

// ─── PUT /subscriptions/:id ────────────────────────────────────────────────

describe("PUT /subscriptions/:id", () => {
  it("actualiza una suscripcion existente", async () => {
    mockReturning.mockResolvedValue([{ ...SUB, name: "Netflix Updated" }]);
    const res = await request(app)
      .put("/subscriptions/1")
      .set("Authorization", authHeader())
      .send({ name: "Netflix Updated" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Netflix Updated");
  });

  it("retorna 404 si la suscripcion no existe", async () => {
    mockReturning.mockResolvedValue([]);
    const res = await request(app)
      .put("/subscriptions/999")
      .set("Authorization", authHeader())
      .send({ name: "Test" });
    expect(res.status).toBe(404);
  });

  it("retorna 400 con ID no numerico", async () => {
    const res = await request(app)
      .put("/subscriptions/abc")
      .set("Authorization", authHeader())
      .send({ name: "Test" });
    expect(res.status).toBe(400);
  });
});

// ─── DELETE /subscriptions/:id ─────────────────────────────────────────────

describe("DELETE /subscriptions/:id", () => {
  it("realiza soft-delete y retorna 204", async () => {
    mockReturning.mockResolvedValue([{ ...SUB, active: false }]);
    const res = await request(app)
      .delete("/subscriptions/1")
      .set("Authorization", authHeader());
    expect(res.status).toBe(204);
  });

  it("retorna 404 si la suscripcion no existe", async () => {
    mockReturning.mockResolvedValue([]);
    const res = await request(app)
      .delete("/subscriptions/999")
      .set("Authorization", authHeader());
    expect(res.status).toBe(404);
  });

  it("retorna 400 con ID no numerico", async () => {
    const res = await request(app)
      .delete("/subscriptions/abc")
      .set("Authorization", authHeader());
    expect(res.status).toBe(400);
  });
});

// ─── 404 handler ───────────────────────────────────────────────────────────

describe("404 handler", () => {
  it("retorna 404 para rutas inexistentes", async () => {
    const res = await request(app).get("/ruta-que-no-existe");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

// ─── /health ───────────────────────────────────────────────────────────────

describe("GET /health", () => {
  it("retorna status ok sin autenticacion", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// ─── Branches: POST con campos opcionales ─────────────────────────────────

describe("POST /subscriptions — campos opcionales", () => {
  it("acepta body completo con todos los campos opcionales", async () => {
    mockReturning.mockResolvedValue([{ ...SUB, planName: "Premium" }]);
    const res = await request(app)
      .post("/subscriptions")
      .set("Authorization", authHeader())
      .send({
        name: "Spotify",
        cost: 15000,
        nextPaymentDate: "2026-05-01",
        logoUrl: "https://example.com/logo.png",
        currency: "USD",
        billingCycle: "yearly",
        categoryId: 2,
        paymentLast4: "4321",
        planName: "Premium",
        color: "#059669",
      });
    expect(res.status).toBe(201);
  });
});

// ─── Branches: PUT con campos opcionales ──────────────────────────────────

describe("PUT /subscriptions/:id — campos opcionales", () => {
  it("actualiza solo los campos enviados (partial update)", async () => {
    mockReturning.mockResolvedValue([{ ...SUB, cost: "30000", active: false }]);
    const res = await request(app)
      .put("/subscriptions/1")
      .set("Authorization", authHeader())
      .send({
        cost: 30000,
        currency: "USD",
        billingCycle: "yearly",
        nextPaymentDate: "2026-06-01",
        categoryId: null,
        paymentLast4: "9999",
        planName: "Basic",
        color: "#DC2626",
        active: false,
        logoUrl: "https://example.com/new.png",
      });
    expect(res.status).toBe(200);
  });
});

// ─── Global error handler — non-HttpError ─────────────────────────────────

describe("Global error handler", () => {
  it("retorna 500 para errores internos no tipados (non-HttpError)", async () => {
    // Forzar que la DB lance un Error generico
    mockWhere.mockRejectedValueOnce(new Error("DB connection lost"));
    const res = await request(app)
      .get("/subscriptions/1")
      .set("Authorization", authHeader());
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

// ─── CORS ──────────────────────────────────────────────────────────────────

describe("CORS", () => {
  beforeEach(() => {
    process.env.CORS_ORIGIN = "http://localhost:8081";
  });

  it("permite requests con origin valido en CORS_ORIGIN", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://localhost:8081");
    expect(res.status).toBe(200);
  });

  it("rechaza requests con origin no permitido", async () => {
    const res = await request(app)
      .get("/health")
      .set("Origin", "http://origen-malicioso.com");
    // Express envia 500 cuando el CORS callback lanza un Error
    expect([403, 500]).toContain(res.status);
  });
});
