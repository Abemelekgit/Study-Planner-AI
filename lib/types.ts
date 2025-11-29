export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskType = 'homework' | 'reading' | 'exam' | 'project' | 'other';

export interface Course {
  id: string;
  user_id: string;
  name: string;
  code?: string;
  color?: string;
  target_hours_per_week?: number;
  created_at: string;
}

export interface Task {
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

export interface StudySession {
  id: string;
  user_id: string;
  task_id?: string;
  course_id: string;
  title: string;
  duration_minutes: number;
  completed_at: string;
  notes?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}

export interface AIPlanResponse {
  summary?: string;
  dayDescriptions?: Record<string, string>;
  studyTips?: string[];
}

export interface GeneratedPlan {
  days: Array<{
    day: string;
    blocks: Array<{
      course: string;
      tasks: string[];
      duration_hours: number;
      notes?: string;
    }>;
  }>;
  summary?: string;
  dayDescriptions?: Record<string, string>;
  studyTips?: string[];
}
