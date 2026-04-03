import { Router, type Router as ExpressRouter } from "express";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "../db/index.js";
import { subscriptions } from "../db/schema.js";
import { supabaseAuth, getRequiredUserId } from "../middleware/supabaseAuth.js";

const router: ExpressRouter = Router();

// ─── GET /insights/monthly?year=2026&month=4 ──────────────────────────────────
router.get("/monthly", supabaseAuth, async (req, res) => {
  const userId = getRequiredUserId(req);

  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;

  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const subs = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.active, true),
        gte(subscriptions.nextPaymentDate, startDate),
        lte(subscriptions.nextPaymentDate, endDate),
      ),
    );

  // Total only counts COP entries (default currency).
  // Multi-currency totals are left to the mobile layer for now.
  const totalCOP = subs
    .filter((s) => s.currency === "COP")
    .reduce((sum, s) => sum + parseFloat(s.cost), 0);

  res.json({
    year,
    month,
    totalCOP,
    breakdown: subs.map((s) => ({
      id: s.id,
      name: s.name,
      cost: s.cost,
      currency: s.currency,
      nextPaymentDate: s.nextPaymentDate,
      color: s.color,
    })),
    count: subs.length,
  });
});

export default router;
