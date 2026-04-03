-- Supabase migration: rename clerk_user_id → user_id
-- Preserves all existing data. Apply this after 0000_open_tigra.sql.
ALTER TABLE "subscriptions" RENAME COLUMN "clerk_user_id" TO "user_id";
