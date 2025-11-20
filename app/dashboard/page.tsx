'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Task, Course } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { TaskCard } from '@/components/TaskCard';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      fetchData(data.user.id);
    };
    checkAuth();
  }, [router]);

  const fetchData = async (userId: string) => {
    try {
      setLoading(true);
      setError('');

      // Fetch upcoming tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'done')
        .order('due_date', { ascending: true })
        .limit(10);

      if (tasksError) {
        console.error('Tasks error:', tasksError);
        setError('Failed to load tasks');
      } else {
        setTasks(tasksData || []);
      }

      // Fetch courses for context
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId);

      if (coursesError) {
        console.error('Courses error:', coursesError);
      } else {
        setCourses(coursesData || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskStatusChange = async (
    taskId: string,
    newStatus: Task['status']
  ) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
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

  const courseMap = new Map(courses.map((c) => [c.id, c.name]));

  const completedCount = (tasks || []).filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const thisWeekCount = (tasks || []).filter((t) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return dueDate >= today && dueDate <= weekEnd;
  }).length;

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">Dashboard</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-900 text-red-100 rounded">
              {error}
            </div>
          )}

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-1">Total Tasks</p>
              <p className="text-3xl font-bold text-white">{totalCount}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-400">{completedCount}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-1">This Week</p>
              <p className="text-3xl font-bold text-blue-400">{thisWeekCount}</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <p className="text-slate-400 text-sm mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-purple-400">{courses.length}</p>
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-6">Upcoming Tasks</h2>
              {tasks.length === 0 ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                  <p className="text-slate-400 mb-4">No upcoming tasks</p>
                  <Link
                    href="/courses"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Create your first course and task
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      courseName={courseMap.get(task.course_id)}
                      onStatusChange={handleTaskStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/courses"
                    className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition text-center"
                  >
                    View Courses
                  </Link>
                  <Link
                    href="/tasks"
                    className="block w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded font-medium transition text-center"
                  >
                    All Tasks
                  </Link>
                  <Link
                    href="/planner"
                    className="block w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition text-center"
                  >
                    AI Planner
                  </Link>
                </div>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-400 mb-2">Progress</p>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {completedCount} of {totalCount} tasks completed
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
