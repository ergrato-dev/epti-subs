import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const TEST_USER_ID = "test-user-uuid-insights";
const JWT_SECRET = "test-secret-at-least-32-chars-long!";

const mockWhere = vi.fn();

vi.mock("../db/index.js", () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: mockWhere,
      }),
    }),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

const { default: app } = await import("../index.js");

function authHeader() {
  const token = jwt.sign({ sub: TEST_USER_ID }, JWT_SECRET, {
    expiresIn: "1h",
  });
  return `Bearer ${token}`;
}

const SUBS = [
  {
    id: 1,
    userId: TEST_USER_ID,
    name: "Netflix",
    cost: "23000",
    currency: "COP",
    nextPaymentDate: "2026-04-15",
    active: true,
    color: "#7C3AED",
  },
  {
    id: 2,
    userId: TEST_USER_ID,
    name: "Spotify",
    cost: "15000",
    currency: "COP",
    nextPaymentDate: "2026-04-20",
    active: true,
    color: "#0891B2",
  },
  {
    id: 3,
    userId: TEST_USER_ID,
    name: "Netflix USD",
    cost: "15.99",
    currency: "USD",
    nextPaymentDate: "2026-04-25",
    active: true,
    color: "#059669",
  },
];

beforeEach(() => {
  process.env.SUPABASE_JWT_SECRET = JWT_SECRET;
  vi.clearAllMocks();
  mockWhere.mockResolvedValue(SUBS);
});

describe("GET /insights/monthly", () => {
  it("retorna totalCOP, breakdown y count correctamente", async () => {
    const res = await request(app)
      .get("/insights/monthly?year=2026&month=4")
      .set("Authorization", authHeader());

    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2026);
    expect(res.body.month).toBe(4);
    expect(res.body.count).toBe(3);
    // Solo sumas COP: 23000 + 15000 = 38000
    expect(res.body.totalCOP).toBe(38000);
    expect(res.body.breakdown).toHaveLength(3);
  });

  it("el breakdown tiene la forma correcta (id, name, cost, currency...)", async () => {
    const res = await request(app)
      .get("/insights/monthly")
      .set("Authorization", authHeader());

    const item = res.body.breakdown[0];
    expect(item).toHaveProperty("id");
    expect(item).toHaveProperty("name");
    expect(item).toHaveProperty("cost");
    expect(item).toHaveProperty("currency");
    expect(item).toHaveProperty("nextPaymentDate");
    expect(item).toHaveProperty("color");
    // NO debe tener userId ni campos internos
    expect(item).not.toHaveProperty("userId");
    expect(item).not.toHaveProperty("active");
  });

  it("usa año y mes actuales cuando no se pasan query params", async () => {
    const res = await request(app)
      .get("/insights/monthly")
      .set("Authorization", authHeader());
    const now = new Date();
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(now.getFullYear());
    expect(res.body.month).toBe(now.getMonth() + 1);
  });

  it("retorna totalCOP=0 si no hay suscripciones en el periodo", async () => {
    mockWhere.mockResolvedValue([]);
    const res = await request(app)
      .get("/insights/monthly?year=2020&month=1")
      .set("Authorization", authHeader());
    expect(res.status).toBe(200);
    expect(res.body.totalCOP).toBe(0);
    expect(res.body.count).toBe(0);
    expect(res.body.breakdown).toHaveLength(0);
  });

  it("rechaza requests sin autenticacion (401)", async () => {
    const res = await request(app).get("/insights/monthly");
    expect(res.status).toBe(401);
  });
});
