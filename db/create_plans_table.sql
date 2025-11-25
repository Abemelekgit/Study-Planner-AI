-- Create a table for storing saved plans
-- Run this with psql or in Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  title text,
  plan_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Optional: add an index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON public.plans (user_id);
