# Study Planner - AI-Powered Study Planning App

> **🎉 Last Updated:** November 20, 2025 | **Status:** ✅ Fully Functional | **Developer:** Abemelekgit

A Next.js 14 web application that helps students organize courses and tasks while leveraging AI to generate personalized weekly study plans.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend & Database**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI API (fallback plan generator included)
- **State Management**: React Hooks

## Features

✨ **Core Features:**
- User authentication (email/password via Supabase)
- Create and manage courses with color coding
- Organize tasks by course with priority, due dates, and time estimates
- Global task view with filtering and sorting
- AI-powered study plan generation using OpenAI
- Dashboard with quick stats and upcoming tasks

## Getting Started

### 1. Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available at [supabase.com](https://supabase.com))
- OpenAI API key (optional - app works with fallback plan generator)

### 2. Setup

#### Clone and Install

```bash
cd studyplannerApp
npm install
```

#### Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI/LLM
AI_API_KEY=your_openai_api_key
AI_PROVIDER=openai
```

#### Get Supabase Credentials

1. Create a project on [supabase.com](https://supabase.com)
2. Go to **Settings → API**
3. Copy `Project URL` and `anon` key

#### Set Up Supabase Database

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create courses table
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  code text null,
  color text null,
  target_hours_per_week integer null,
  created_at timestamptz not null default now()
);

-- Create tasks table
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text null,
  type text not null default 'homework',
  status text not null default 'todo',
  priority text not null default 'medium',
  due_date timestamptz null,
  estimated_hours decimal null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

-- Create study_sessions table (for future enhancement)
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  task_id uuid null references public.tasks(id) on delete set null,
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  duration_minutes integer not null,
  notes text null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.courses enable row level security;
alter table public.tasks enable row level security;
alter table public.study_sessions enable row level security;

-- Create policies for courses
create policy "Users can view own courses" on public.courses for select using (auth.uid() = user_id);
create policy "Users can insert own courses" on public.courses for insert with check (auth.uid() = user_id);
create policy "Users can update own courses" on public.courses for update using (auth.uid() = user_id);
create policy "Users can delete own courses" on public.courses for delete using (auth.uid() = user_id);

-- Create policies for tasks
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- Create policies for study_sessions
create policy "Users can view own sessions" on public.study_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own sessions" on public.study_sessions for insert with check (auth.uid() = user_id);
create policy "Users can delete own sessions" on public.study_sessions for delete using (auth.uid() = user_id);
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Sign Up
- Go to `/signup` and create an account
- Verify with your email

### 2. Create Courses
- Navigate to `/courses`
- Click "+ New Course"
- Add course name, code, color, and target hours

### 3. Add Tasks
- Click on a course to open its detail page
- Click "+ New Task"
- Fill in task details: title, type, priority, due date, estimated hours

### 4. View Tasks
- Dashboard (`/dashboard`): See upcoming tasks and stats
- All Tasks (`/tasks`): View all tasks with filtering by course/status
- Course Detail: See course-specific tasks

### 5. Generate Study Plan
- Go to `/planner`
- Set your daily available study hours
- Click "Generate Plan with AI"
- View the AI-generated weekly schedule

## Project Structure

```
app/
├── page.tsx                 # Landing page
├── layout.tsx               # Root layout with globals.css
├── dashboard/page.tsx       # Dashboard (stats, upcoming tasks)
├── login/page.tsx          # Login page
├── signup/page.tsx         # Sign up page
├── courses/page.tsx        # Courses list
├── courses/[courseId]/page.tsx # Course detail
├── tasks/page.tsx          # Global tasks view
├── planner/page.tsx        # AI study planner
├── api/ai/plan/route.ts    # AI plan generation API
└── globals.css

components/
├── Navbar.tsx              # Navigation bar
├── CourseCard.tsx          # Course display card
├── CourseForm.tsx          # Course creation/edit form
├── TaskCard.tsx            # Task display card
└── TaskForm.tsx            # Task creation/edit form

lib/
├── types.ts                # TypeScript types
└── supabaseClient.ts       # Supabase client

.env.local                  # Environment variables (create from .env.local.example)
```

## API Routes

### POST /api/ai/plan
Generates a weekly study plan using AI.

**Request:**
```json
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Read Chapter 1",
      "course_id": "course-1",
      "due_date": "2025-11-25T23:59:59Z",
      "estimated_hours": 2,
      "priority": "high"
    }
  ],
  "preferences": {
    "dailyHours": 3
  }
}
```

**Response:**
```json
{
  "plan": {
    "days": [
      {
        "day": "Monday",
        "blocks": [
          {
            "course": "Econometrics",
            "tasks": ["Read Chapter 1", "Take notes"],
            "duration_hours": 2,
            "notes": "Morning focus block"
          }
        ]
      }
    ]
  }
}
```

## Component Breakdown

### Navbar
- Auth status display
- Navigation links (Dashboard, Courses, Tasks, Planner)
- Login/Logout functionality

### CourseCard
- Displays course with color
- Shows task count
- Links to course detail

### TaskCard
- Shows task title, priority, due date
- Allows status updates (To Do → In Progress → Done)
- Displays course context

### TaskForm
- Create/edit tasks
- Fields: title, description, type, priority, due date, estimated hours
- Form validation

### CourseForm
- Create/edit courses
- Color picker for course coding
- Target hours per week setting

## Type Definitions

```typescript
type TaskStatus = 'todo' | 'in_progress' | 'done';
type TaskPriority = 'low' | 'medium' | 'high';
type TaskType = 'homework' | 'reading' | 'exam' | 'project' | 'other';

interface Task {
  id: string;
  user_id: string;
  course_id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  estimated_hours?: number;
  created_at: string;
  completed_at?: string;
}

interface Course {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  color?: string;
  target_hours_per_week?: number;
  created_at: string;
}
```

## Authentication

Uses Supabase Auth with email/password:
- Sign up: Creates a new user account
- Log in: Authenticates existing users
- Session management: Persisted across page reloads
- Protected routes: Redirect to login if not authenticated

## AI Planning

The app uses OpenAI's API for plan generation:

1. **Fallback Mode** (no API key): Simple task distribution across the week
2. **OpenAI Mode** (with API key): Smart scheduling based on:
   - Task priorities
   - Estimated hours
   - Due dates
   - Course distribution

The AI responds with a structured JSON plan distributed across 7 days.

## Styling

Uses Tailwind CSS with a dark theme:
- Color scheme: Slate backgrounds, white text
- Cards: Slate-800 with slate-700 borders
- Buttons: Blue primary, slate secondary
- Status colors: Green (done), yellow (in-progress), blue (todo)
- Priority colors: Red (high), yellow (medium), blue (low)

## Development Notes

- **No Redux/Zustand**: Uses React hooks for state
- **Server Components**: Landing page is SSR, client components use `'use client'`
- **Error Handling**: User-friendly error messages throughout
- **Loading States**: Visual feedback during async operations
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **TypeScript Strict Mode**: Enabled for type safety

## Future Enhancements

- Study session tracking (Pomodoro timer)
- Calendar view of tasks and plan
- Task templates for recurring work
- Collaborative course sharing
- Mobile app (React Native)
- Notification reminders
- Export plans to PDF
- Integration with calendar APIs

## License

MIT

## Support

For issues or questions:
1. Check the [bible.md](./bible.md) for project specifications
2. Review component implementations
3. Check Supabase console for data/auth issues
4. Verify API keys in `.env.local`

---

Built with ❤️ using Next.js + Supabase + AI
