-- Row-level security for plans table
-- Ensures users can only access their own plans via RLS policies

alter table public.plans enable row level security;

create policy "Users can select own plans" on public.plans for select using (auth.uid() = user_id);
create policy "Users can insert own plans" on public.plans for insert with check (auth.uid() = user_id);
create policy "Users can delete own plans" on public.plans for delete using (auth.uid() = user_id);
