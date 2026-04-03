import "dotenv/config";
import express, { type Express } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { HttpError } from "./middleware/clerkAuth.js";
import subscriptionsRouter from "./routes/subscriptions.js";
import insightsRouter from "./routes/insights.js";

const app: Express = express();
const PORT = Number(process.env.PORT) || 3000;

// ─── Security / CORS ──────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:8081",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// ─── Body parsing (10 kb limit to mitigate large payload attacks) ─────────────
app.use(express.json({ limit: "10kb" }));

// ─── Clerk authentication middleware (populates req.auth) ─────────────────────
app.use(clerkMiddleware());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/subscriptions", subscriptionsRouter);
app.use("/insights", insightsRouter);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// Express 5 automatically forwards async errors here — no try/catch needed in routes.
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    const status = err instanceof HttpError ? err.status : 500;
    if (status >= 500) console.error(err.stack);
    res.status(status).json({ error: err.message ?? "Internal server error" });
  },
);

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[API] Listening on http://localhost:${PORT}`);
});

export default app;
