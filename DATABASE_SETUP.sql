-- Study Planner Database Setup Script
-- Run this entire script in your Supabase SQL Editor

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text,
  color text,
  target_hours_per_week integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT courses_name_not_empty CHECK (char_length(name) > 0)
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'homework' CHECK (type IN ('homework', 'reading', 'exam', 'project', 'other')),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date timestamptz,
  estimated_hours decimal,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT tasks_title_not_empty CHECK (char_length(title) > 0),
  CONSTRAINT estimated_hours_positive CHECK (estimated_hours > 0 OR estimated_hours IS NULL)
);

-- Study Sessions Table (for future use)
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  notes text,
  completed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT study_sessions_title_not_empty CHECK (char_length(title) > 0)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON public.courses(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_course_id ON public.tasks(course_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_course_id ON public.study_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_task_id ON public.study_sessions(task_id);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE ROW LEVEL SECURITY POLICIES FOR COURSES
-- ============================================================================

-- View own courses
CREATE POLICY "courses_select_own" ON public.courses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own courses
CREATE POLICY "courses_insert_own" ON public.courses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update own courses
CREATE POLICY "courses_update_own" ON public.courses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own courses
CREATE POLICY "courses_delete_own" ON public.courses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. CREATE ROW LEVEL SECURITY POLICIES FOR TASKS
-- ============================================================================

-- View own tasks
CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own tasks
CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update own tasks
CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete own tasks
CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 6. CREATE ROW LEVEL SECURITY POLICIES FOR STUDY SESSIONS
-- ============================================================================

-- View own sessions
CREATE POLICY "study_sessions_select_own" ON public.study_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Insert own sessions
CREATE POLICY "study_sessions_insert_own" ON public.study_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Delete own sessions
CREATE POLICY "study_sessions_delete_own" ON public.study_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.courses TO authenticated;
GRANT INSERT ON public.courses TO authenticated;
GRANT UPDATE ON public.courses TO authenticated;
GRANT DELETE ON public.courses TO authenticated;

GRANT SELECT ON public.tasks TO authenticated;
GRANT INSERT ON public.tasks TO authenticated;
GRANT UPDATE ON public.tasks TO authenticated;
GRANT DELETE ON public.tasks TO authenticated;

GRANT SELECT ON public.study_sessions TO authenticated;
GRANT INSERT ON public.study_sessions TO authenticated;
GRANT DELETE ON public.study_sessions TO authenticated;

-- ============================================================================
-- 8. CREATE USEFUL VIEWS (Optional)
-- ============================================================================

-- View for tasks due this week
CREATE OR REPLACE VIEW public.tasks_due_this_week AS
SELECT 
  t.*,
  c.name as course_name
FROM public.tasks t
JOIN public.courses c ON t.course_id = c.id
WHERE t.user_id = auth.uid()
  AND t.due_date >= NOW()
  AND t.due_date <= NOW() + interval '7 days'
  AND t.status != 'done'
ORDER BY t.due_date ASC;

-- View for course statistics
CREATE OR REPLACE VIEW public.course_stats AS
SELECT 
  c.id,
  c.name,
  c.user_id,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks,
  COUNT(CASE WHEN t.status = 'todo' THEN 1 END) as todo_tasks,
  COALESCE(SUM(t.estimated_hours), 0) as total_estimated_hours
FROM public.courses c
LEFT JOIN public.tasks t ON c.id = t.course_id
GROUP BY c.id, c.name, c.user_id;

-- ============================================================================
-- 9. TEST DATA (Optional - comment out for production)
-- ============================================================================

-- You can uncomment the lines below to add sample data for testing
-- Replace 'user_id_here' with an actual user ID from your auth.users table

-- INSERT INTO public.courses (user_id, name, code, color, target_hours_per_week)
-- VALUES 
--   ('user_id_here', 'Econometrics', 'ECON 301', 'bg-blue-600', 5),
--   ('user_id_here', 'Data Visualization', 'CS 405', 'bg-purple-600', 4);

-- INSERT INTO public.tasks (user_id, course_id, title, type, priority, estimated_hours, due_date, description)
-- VALUES 
--   ('user_id_here', 'course_id_1', 'Read Chapter 1-2', 'reading', 'medium', 2, now() + interval '3 days', 'Chapters on regression analysis'),
--   ('user_id_here', 'course_id_1', 'Homework 1', 'homework', 'high', 3, now() + interval '7 days', 'Econometric models assignment'),
--   ('user_id_here', 'course_id_2', 'Design mockups', 'project', 'high', 5, now() + interval '10 days', 'Interactive dashboard prototype');

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the setup is complete:

-- Check tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Check indexes exist
-- SELECT indexname FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY indexname;

-- Check policies exist
-- SELECT policyname, tablename FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- ============================================================================
-- Setup complete!
-- ============================================================================

-- Your database is now ready to use with the Study Planner app.
-- 
-- Next steps:
-- 1. Copy your Supabase Project URL and Anon Key
-- 2. Create .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
-- 3. Run: npm install
-- 4. Run: npm run dev
-- 5. Sign up and start using the app!
