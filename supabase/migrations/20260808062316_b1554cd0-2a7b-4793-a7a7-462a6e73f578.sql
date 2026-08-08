DO $$ BEGIN
  CREATE TYPE public.plan_cycle AS ENUM ('none', 'monthly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_cycle public.plan_cycle NOT NULL DEFAULT 'none';