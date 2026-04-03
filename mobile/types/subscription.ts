export type BillingCycle =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export interface Subscription {
  id: number;
  userId: string;
  name: string;
  logoUrl: string | null;
  cost: string;
  currency: string;
  billingCycle: BillingCycle;
  nextPaymentDate: string; // ISO date "YYYY-MM-DD"
  categoryId: number | null;
  paymentLast4: string | null;
  planName: string | null;
  color: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsightsMonthly {
  year: number;
  month: number;
  totalCOP: number;
  count: number;
  breakdown: {
    id: number;
    name: string;
    cost: string;
    currency: string;
    nextPaymentDate: string;
    color: string | null;
  }[];
}
