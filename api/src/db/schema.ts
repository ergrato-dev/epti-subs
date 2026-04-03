import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  numeric,
  date,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const billingCycleEnum = pgEnum("billing_cycle", [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "yearly",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 100 }),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  logoUrl: text("logo_url"),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("COP"),
  billingCycle: billingCycleEnum("billing_cycle").notNull().default("monthly"),
  nextPaymentDate: date("next_payment_date", { mode: "string" }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  paymentLast4: varchar("payment_last4", { length: 4 }),
  planName: varchar("plan_name", { length: 100 }),
  color: varchar("color", { length: 7 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Category = typeof categories.$inferSelect;
