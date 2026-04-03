import { Router, type Router as ExpressRouter } from "express";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptions } from "../db/schema.js";
import {
  supabaseAuth,
  getRequiredUserId,
  HttpError,
} from "../middleware/supabaseAuth.js";

const router: ExpressRouter = Router();

// ─── GET /subscriptions ───────────────────────────────────────────────────────
router.get("/", supabaseAuth, async (req, res) => {
  const userId = getRequiredUserId(req);

  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.clerkUserId, userId),
        eq(subscriptions.active, true),
      ),
    );

  res.json(result);
});

// ─── GET /subscriptions/upcoming ─────────────────────────────────────────────
// Must be defined BEFORE /:id to avoid route shadowing
router.get("/upcoming", supabaseAuth, async (req, res) => {
  const userId = getRequiredUserId(req);

  const today = new Date().toISOString().split("T")[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.clerkUserId, userId),
        eq(subscriptions.active, true),
        gte(subscriptions.nextPaymentDate, today),
        lte(subscriptions.nextPaymentDate, in30Days),
      ),
    );

  res.json(result);
});

// ─── GET /subscriptions/:id ───────────────────────────────────────────────────
router.get("/:id", supabaseAuth, async (req, res) => {
  const userId = getRequiredUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) throw new HttpError(400, "Invalid id");

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(
      and(eq(subscriptions.id, id), eq(subscriptions.clerkUserId, userId)),
    );

  if (!sub) throw new HttpError(404, "Subscription not found");
  res.json(sub);
});

// ─── POST /subscriptions ──────────────────────────────────────────────────────
router.post("/", supabaseAuth, async (req, res) => {
  const userId = getRequiredUserId(req);

  const {
    name,
    logoUrl,
    cost,
    currency,
    billingCycle,
    nextPaymentDate,
    categoryId,
    paymentLast4,
    planName,
    color,
  } = req.body as Record<string, unknown>;

  if (!name || cost === undefined || !nextPaymentDate) {
    throw new HttpError(400, "name, cost, and nextPaymentDate are required");
  }

  const [created] = await db
    .insert(subscriptions)
    .values({
      userId: userId,
      name: String(name),
      logoUrl: logoUrl ? String(logoUrl) : null,
      cost: String(cost),
      currency: currency ? String(currency) : "COP",
      billingCycle: (billingCycle as "monthly") ?? "monthly",
      nextPaymentDate: String(nextPaymentDate),
      categoryId: categoryId ? Number(categoryId) : null,
      paymentLast4: paymentLast4 ? String(paymentLast4) : null,
      planName: planName ? String(planName) : null,
      color: color ? String(color) : null,
    })
    .returning();

  res.status(201).json(created);
});

// ─── PUT /subscriptions/:id ───────────────────────────────────────────────────
router.put("/:id", supabaseAuth, async (req, res) => {
  const userId = getRequiredUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) throw new HttpError(400, "Invalid id");

  const {
    name,
    logoUrl,
    cost,
    currency,
    billingCycle,
    nextPaymentDate,
    categoryId,
    paymentLast4,
    planName,
    color,
    active,
  } = req.body as Record<string, unknown>;

  const [updated] = await db
    .update(subscriptions)
    .set({
      ...(name !== undefined && { name: String(name) }),
      ...(logoUrl !== undefined && { logoUrl: String(logoUrl) }),
      ...(cost !== undefined && { cost: String(cost) }),
      ...(currency !== undefined && { currency: String(currency) }),
      ...(billingCycle !== undefined && {
        billingCycle: billingCycle as "monthly",
      }),
      ...(nextPaymentDate !== undefined && {
        nextPaymentDate: String(nextPaymentDate),
      }),
      ...(categoryId !== undefined && {
        categoryId: categoryId ? Number(categoryId) : null,
      }),
      ...(paymentLast4 !== undefined && { paymentLast4: String(paymentLast4) }),
      ...(planName !== undefined && { planName: String(planName) }),
      ...(color !== undefined && { color: String(color) }),
      ...(active !== undefined && { active: Boolean(active) }),
      updatedAt: new Date(),
    })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .returning();

  if (!updated) throw new HttpError(404, "Subscription not found");
  res.json(updated);
});

// ─── DELETE /subscriptions/:id (soft delete) ──────────────────────────────────
router.delete("/:id", supabaseAuth, async (req, res) => {
  const userId = getRequiredUserId(req);
  const id = Number(req.params.id);
  if (isNaN(id)) throw new HttpError(400, "Invalid id");

  const [deleted] = await db
    .update(subscriptions)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)))
    .returning();

  if (!deleted) throw new HttpError(404, "Subscription not found");
  res.status(204).send();
});

export default router;
