'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Task } from '@/lib/types';
import { Navbar } from '@/components/Navbar';

interface PlanBlock {
  course: string;
  tasks: string[];
  duration_hours: number;
  notes?: string;
}

interface PlanDay {
  day: string;
  blocks: PlanBlock[];
}

interface GeneratedPlan {
  days: PlanDay[];
}

export default function PlannerPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dailyHours, setDailyHours] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        router.push('/login');
        return;
      }
      setUser(data.user);
      fetchTasks(data.user.id);
    };
    checkAuth();
  }, [router]);

  const fetchTasks = async (userId: string) => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .neq('status', 'done')
        .order('due_date', { ascending: true });

      if (fetchError) {
        setError('Failed to load tasks');
        console.error(fetchError);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      setError('An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setPlan(null);

    try {
      if (tasks.length === 0) {
        setError('No tasks found. Create some tasks first.');
        setGenerating(false);
        return;
      }

      const response = await fetch('/api/ai/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            course_id: t.course_id,
            due_date: t.due_date,
            estimated_hours: t.estimated_hours,
            priority: t.priority,
          })),
          preferences: {
            dailyHours: Number(dailyHours),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        setError(errorData.error || 'Failed to generate plan');
      } else {
        const data = await response.json();
        console.log('Generated plan:', data);
        if (data.plan) {
          setPlan(data.plan);
        } else {
          setError('No plan data received from server');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-slate-300">Loading...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="bg-slate-950 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">AI Study Planner</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-900 text-red-100 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-1">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-white mb-4">
                  Generate Plan
                </h2>

                <form onSubmit={handleGeneratePlan} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Daily Study Hours
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      step="0.5"
                      value={dailyHours}
                      onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-2 text-xs text-slate-400">
                    <p className="mb-2">📚 Tasks to schedule:</p>
                    <p className="font-bold text-blue-400">{tasks.length}</p>
                  </div>

                  <button
                    type="submit"
                    disabled={generating || tasks.length === 0}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded font-medium transition"
                  >
                    {generating ? 'Generating...' : 'Generate Plan'}
                  </button>
                </form>
              </div>
            </div>

            {/* Plan Display Section */}
            <div className="lg:col-span-3">
              {!plan ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                  <p className="text-slate-400 mb-4 text-lg">
                    👋 No plan generated yet
                  </p>
                  <p className="text-slate-500">
                    Adjust your preferences and click "Generate Plan" to create
                    your AI-powered weekly study schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {plan.days.map((planDay, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
                    >
                      <div className="bg-slate-700 px-6 py-4 border-b border-slate-600">
                        <h3 className="text-lg font-bold text-white">
                          {planDay.day}
                        </h3>
                      </div>

                      <div className="p-6 space-y-4">
                        {planDay.blocks.length === 0 ? (
                          <p className="text-slate-500 text-center py-4">
                            No sessions scheduled
                          </p>
                        ) : (
                          planDay.blocks.map((block, blockIndex) => (
                            <div
                              key={blockIndex}
                              className="bg-slate-700 rounded-lg p-4 border-l-4 border-blue-500"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold text-white">
                                  {block.course}
                                </h4>
                                <span className="text-xs bg-blue-600 px-2 py-1 rounded text-white">
                                  {block.duration_hours}h
                                </span>
                              </div>

                              {block.notes && (
                                <p className="text-xs text-slate-400 mb-2 italic">
                                  {block.notes}
                                </p>
                              )}

                              <ul className="space-y-1">
                                {block.tasks.map((task, taskIndex) => (
                                  <li
                                    key={taskIndex}
                                    className="text-sm text-slate-300 flex items-start"
                                  >
                                    <span className="mr-2">✓</span>
                                    <span>{task}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Plan Summary */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h4 className="font-bold text-white mb-4">Plan Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-400 text-sm">Total Days</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {plan.days.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">Total Blocks</p>
                        <p className="text-2xl font-bold text-green-400">
                          {plan.days.reduce(
                            (sum, day) => sum + day.blocks.length,
                            0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
