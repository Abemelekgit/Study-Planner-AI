'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Course, Task } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { TaskCard } from '@/components/TaskCard';
import { TaskForm } from '@/components/TaskForm';
import Link from 'next/link';

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;

  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      fetchCourseAndTasks(data.user.id, courseId);
    };
    checkAuth();
  }, [router, courseId]);

  const fetchCourseAndTasks = async (userId: string, cId: string) => {
    try {
      setLoading(true);
      setError('');

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', cId)
        .eq('user_id', userId)
        .single();

      if (courseError) {
        setError('Course not found');
        console.error(courseError);
      } else if (courseData) {
        setCourse(courseData);
      }

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('course_id', cId)
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (tasksError) {
        console.error('Tasks error:', tasksError);
      } else {
        setTasks(tasksData || []);
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (data: any) => {
    if (!user) return;
    setFormLoading(true);
    try {
      const { error: insertError } = await supabase.from('tasks').insert({
        user_id: user.id,
        course_id: courseId,
        status: 'todo',
        priority: data.priority,
        ...data,
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        setShowForm(false);
        fetchCourseAndTasks(user.id, courseId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleTaskStatusChange = async (
    taskId: string,
    newStatus: Task['status']
  ) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: newStatus === 'done' ? new Date().toISOString() : null,
        })
        .eq('id', taskId);

      if (error) {
        setError('Failed to update task');
      } else {
        setTasks(
          tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          )
        );
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-300">Loading course...</p>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-slate-300 mb-4">Course not found</p>
            <Link href="/courses" className="text-blue-400 hover:text-blue-300">
              Back to Courses
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/courses"
            className="text-blue-400 hover:text-blue-300 mb-6 inline-block"
          >
            ← Back to Courses
          </Link>

          <div className={`${course.color || 'bg-blue-600'} rounded-lg p-8 mb-8 text-white`}>
            <h1 className="text-4xl font-bold mb-2">{course.name}</h1>
            {course.code && <p className="text-lg opacity-90">{course.code}</p>}
            {course.target_hours_per_week && (
              <p className="text-sm opacity-75 mt-2">
                Target: {course.target_hours_per_week} hours per week
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900 text-red-100 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Tasks</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                >
                  {showForm ? 'Cancel' : '+ New Task'}
                </button>
              </div>

              {showForm && (
                <div className="mb-8">
                  <TaskForm
                    courseId={courseId}
                    onSubmit={handleCreateTask}
                    isLoading={formLoading}
                  />
                </div>
              )}

              {tasks.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                  <p className="text-slate-400 mb-4">No tasks yet</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
                  >
                    Create First Task
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={handleTaskStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Stats Sidebar */}
            <div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-400 text-sm">Total Tasks</p>
                    <p className="text-2xl font-bold text-white">{tasks.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-green-400">
                      {tasks.filter((t) => t.status === 'done').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {tasks.filter((t) => t.status === 'in_progress').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">To Do</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {tasks.filter((t) => t.status === 'todo').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
