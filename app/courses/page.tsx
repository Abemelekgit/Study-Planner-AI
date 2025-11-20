'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Course, Task } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { CourseCard } from '@/components/CourseCard';
import { CourseForm } from '@/components/CourseForm';

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
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
      fetchCourses(data.user.id);
    };
    checkAuth();
  }, [router]);

  const fetchCourses = async (userId: string) => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError('Failed to load courses');
        console.error(fetchError);
      } else {
        setCourses(data || []);
        fetchTaskCounts(userId, data || []);
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskCounts = async (userId: string, coursesList: Course[]) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('course_id')
        .eq('user_id', userId);

      if (!fetchError && data) {
        const counts: Record<string, number> = {};
        coursesList.forEach((course) => {
          counts[course.id] = data.filter((t: any) => t.course_id === course.id).length;
        });
        setTaskCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching task counts:', err);
    }
  };

  const handleCreateCourse = async (data: any) => {
    if (!user) return;
    setFormLoading(true);
    try {
      const { error: insertError } = await supabase.from('courses').insert({
        user_id: user.id,
        ...data,
      });

      if (insertError) {
        setError(insertError.message);
      } else {
        setShowForm(false);
        fetchCourses(user.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create course');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-300">Loading courses...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Courses</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
            >
              {showForm ? 'Cancel' : '+ New Course'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900 text-red-100 rounded">
              {error}
            </div>
          )}

          {showForm && (
            <div className="mb-8">
              <CourseForm
                onSubmit={handleCreateCourse}
                isLoading={formLoading}
              />
            </div>
          )}

          {courses.length === 0 ? (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <p className="text-slate-400 mb-4 text-lg">No courses yet</p>
              <p className="text-slate-500 mb-6">
                Create your first course to get started
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition"
              >
                Create First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  taskCount={taskCounts[course.id] || 0}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
