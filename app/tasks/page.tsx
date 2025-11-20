'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Task, Course, TaskStatus } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { TaskCard } from '@/components/TaskCard';

export default function TasksPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'due-date' | 'priority'>('due-date');

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

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (tasksError) {
        setError('Failed to load tasks');
        console.error(tasksError);
      } else {
        setAllTasks(tasksData || []);
        setTasks(tasksData || []);
      }

      // Fetch courses
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
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...allTasks];

    if (selectedCourse) {
      filtered = filtered.filter((t) => t.course_id === selectedCourse);
    }

    if (selectedStatus) {
      filtered = filtered.filter((t) => t.status === selectedStatus);
    }

    if (sortBy === 'priority') {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      filtered.sort(
        (a, b) =>
          priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder]
      );
    }

    setTasks(filtered);
  }, [selectedCourse, selectedStatus, sortBy, allTasks]);

  const handleTaskStatusChange = async (
    taskId: string,
    newStatus: TaskStatus
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
        setAllTasks(
          allTasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          )
        );
      }
    } catch (err) {
      setError('An error occurred');
    }
  };

  const courseMap = new Map(courses.map((c) => [c.id, c.name]));

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-300">Loading tasks...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">All Tasks</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-900 text-red-100 rounded">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Course
              </label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'due-date' | 'priority')}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              >
                <option value="due-date">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          {/* Tasks List */}
          {tasks.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-400 mb-4">No tasks found</p>
              <p className="text-slate-500 text-sm">
                Try adjusting your filters or create a new task in a course.
              </p>
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

          {/* Summary */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm mb-1">To Do</p>
              <p className="text-2xl font-bold text-blue-400">
                {tasks.filter((t) => t.status === 'todo').length}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm mb-1">In Progress</p>
              <p className="text-2xl font-bold text-yellow-400">
                {tasks.filter((t) => t.status === 'in_progress').length}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm mb-1">Done</p>
              <p className="text-2xl font-bold text-green-400">
                {tasks.filter((t) => t.status === 'done').length}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
