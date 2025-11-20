# Study Planner App – Project Bible

## 1. Project Overview

**Name:** Study Planner  
**Stack:** Next.js (App Router) + React + TypeScript + Tailwind CSS + Supabase  

The app is a personal study manager for students.  
Main goals:

- Let a user:
  - Create **courses**
  - Create **tasks** for those courses (assignments, exams, readings, etc.)
  - See **upcoming tasks** and basic **progress**
- Focus on:
  - Clean UI
  - Simple but solid architecture
  - Code that looks professional for a portfolio

---

## 2. Tech Stack & Libraries

- **Frontend framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **UI:** Tailwind CSS
- **State:** React hooks (`useState`, `useEffect`, `useMemo`, etc.)
- **Backend / DB / Auth:** Supabase (PostgreSQL + Auth)
- **Styling rules:**
  - Use Tailwind for layout/spacing/colors.
  - Components should be responsive by default.

No Redux, no extra libraries unless really needed.

---

## 3. Core Domain Concepts

### User
- Comes from Supabase `auth.users`.
- Every course/task belongs to a specific user.

### Course
- A subject the user is studying.
- Examples: “Econometrics”, “Data Visualization”.

Fields:
- `id`, `user_id`, `name`, `code`, `color`, `target_hours_per_week`, `created_at`

### Task
- A unit of work for a course.
- Examples: “Homework 1”, “Read Chapter 3”, “Prepare for Midterm”.

Fields:
- `id`, `user_id`, `course_id`, `title`, `description`, `type`, `status`,
  `priority`, `due_date`, `estimated_hours`, `created_at`, `completed_at`

### StudySession (later)
- Represents a focused study block (like Pomodoro).
- Optional for v1, but keep in mind.

---

## 4. Database Schema (Supabase)

### Table: `courses`

```sql
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  code text null,
  color text null,
  target_hours_per_week integer null,
  created_at timestamptz not null default now()
);
