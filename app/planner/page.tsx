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
  summary?: string;
  dayDescriptions?: Record<string, string>;
  studyTips?: string[];
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

      // Fetch tasks with course names
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          id,
          user_id,
          course_id,
          title,
          description,
          type,
          status,
          priority,
          due_date,
          estimated_hours,
          created_at,
          completed_at
        `)
        .eq('user_id', userId)
        .neq('status', 'done')
        .order('due_date', { ascending: true });

      if (tasksError) {
        setError('Failed to load tasks');
        console.error(tasksError);
      } else {
        // Fetch course names
        const courseIds = [...new Set((tasksData || []).map(t => t.course_id))];
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, name')
          .in('id', courseIds);

        if (!coursesError && coursesData) {
          // Map course names to tasks
          const courseMap: Record<string, string> = {};
          coursesData.forEach(c => {
            courseMap[c.id] = c.name;
          });

          const enhancedTasks = (tasksData || []).map(t => ({
            ...t,
            course_name: courseMap[t.course_id] || 'Unknown Course'
          }));

          setTasks(enhancedTasks as any);
        } else {
          setTasks(tasksData || []);
        }
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

  // Helper function to export plan as text
  const handleExportPlan = () => {
    if (!plan) return;

    let exportText = '📚 STUDY PLAN EXPORT\n';
    exportText += '='.repeat(50) + '\n\n';

    // Add summary
    if (plan.summary) {
      exportText += '📋 PLAN SUMMARY\n';
      exportText += '-'.repeat(50) + '\n';
      exportText += plan.summary + '\n\n';
    }

    // Add weekly schedule
    exportText += '📅 WEEKLY SCHEDULE\n';
    exportText += '-'.repeat(50) + '\n';
    plan.days.forEach(day => {
      exportText += `\n${day.day.toUpperCase()}:\n`;
      day.blocks.forEach(block => {
        exportText += `  📖 ${block.course} (${block.duration_hours.toFixed(1)}h)\n`;
        block.tasks.forEach(task => {
          exportText += `     • ${task}\n`;
        });
      });
    });

    // Add day descriptions
    if (plan.dayDescriptions) {
      exportText += '\n\n📖 DETAILED DAY GUIDE\n';
      exportText += '-'.repeat(50) + '\n';
      plan.days.forEach(day => {
        exportText += `\n${day.day}:\n`;
        exportText += plan.dayDescriptions![day.day] + '\n';
      });
    }

    // Add study tips
    if (plan.studyTips) {
      exportText += '\n\n💡 STUDY TIPS & STRATEGIES\n';
      exportText += '-'.repeat(50) + '\n';
      plan.studyTips.forEach((tip, idx) => {
        exportText += `${idx + 1}. ${tip}\n`;
      });
    }

    exportText += '\n\n' + '='.repeat(50) + '\n';
    exportText += `Generated on ${new Date().toLocaleString()}\n`;

    // Create blob and download
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-plan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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

                  {plan && (
                    <button
                      type="button"
                      onClick={handleExportPlan}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition flex items-center justify-center gap-2 mt-3"
                    >
                      <span>📥</span> Export as Text
                    </button>
                  )}
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
                  {/* Plan Summary */}
                  {plan.summary && (
                    <div className="bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-700 rounded-lg p-6">
                      <h3 className="font-bold text-white mb-3 flex items-center gap-2 text-lg">
                        <span>📋</span> Study Plan Overview
                      </h3>
                      <p className="text-blue-100 leading-relaxed">{plan.summary}</p>
                    </div>
                  )}

                  {/* Weekly Plan Table */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-700 border-b border-slate-600">
                            <th className="px-4 py-3 text-left font-bold text-white">Day</th>
                            <th className="px-4 py-3 text-left font-bold text-white">Course</th>
                            <th className="px-4 py-3 text-left font-bold text-white">Tasks</th>
                            <th className="px-4 py-3 text-center font-bold text-white">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.days.map((planDay, dayIndex) => (
                            planDay.blocks.map((block, blockIndex) => (
                              <tr
                                key={`${dayIndex}-${blockIndex}`}
                                className={`border-b border-slate-600 hover:bg-slate-700 transition ${
                                  blockIndex === 0 ? 'bg-slate-800' : 'bg-slate-850'
                                }`}
                              >
                                {/* Day - only show on first block of the day */}
                                {blockIndex === 0 ? (
                                  <td className="px-4 py-3 font-semibold text-white align-top">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                      {planDay.day}
                                    </div>
                                  </td>
                                ) : (
                                  <td className="px-4 py-3"></td>
                                )}

                                {/* Course Name */}
                                <td className="px-4 py-3 text-slate-300">
                                  <span className="bg-purple-900 bg-opacity-50 px-2 py-1 rounded text-purple-200 text-xs font-medium">
                                    {block.course}
                                  </span>
                                </td>

                                {/* Tasks List */}
                                <td className="px-4 py-3 text-slate-300">
                                  <ul className="space-y-1">
                                    {block.tasks.map((task, idx) => (
                                      <li key={idx} className="flex items-start gap-2">
                                        <span className="text-blue-400 mt-0.5">✓</span>
                                        <span className="text-slate-200">{task}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </td>

                                {/* Duration */}
                                <td className="px-4 py-3 text-center">
                                  <span className="bg-green-900 bg-opacity-60 px-3 py-1 rounded-full text-green-200 font-semibold text-sm">
                                    {block.duration_hours.toFixed(1)}h
                                  </span>
                                </td>
                              </tr>
                            ))
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Days Planned</p>
                      <p className="text-3xl font-bold text-blue-400">{plan.days.length}</p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Study Sessions</p>
                      <p className="text-3xl font-bold text-purple-400">
                        {plan.days.reduce((sum, day) => sum + day.blocks.length, 0)}
                      </p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Total Hours</p>
                      <p className="text-3xl font-bold text-green-400">
                        {plan.days
                          .reduce((sum, day) => sum + day.blocks.reduce((bSum, b) => bSum + b.duration_hours, 0), 0)
                          .toFixed(1)}
                      </p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">Courses</p>
                      <p className="text-3xl font-bold text-orange-400">
                        {new Set(plan.days.flatMap(day => day.blocks.map(b => b.course))).size}
                      </p>
                    </div>
                  </div>

                  {/* Daily Breakdown with Progress Bars */}
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                      <span>📊</span> Daily Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plan.days.map((day, idx) => {
                        const dayTotal = day.blocks.reduce((sum, b) => sum + b.duration_hours, 0);
                        return (
                          <div key={idx} className="bg-slate-700 rounded p-3 flex justify-between items-center">
                            <span className="text-slate-300 font-medium">{day.day}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-slate-600 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                  style={{ width: `${Math.min((dayTotal / dailyHours) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-green-400 font-semibold text-sm w-12 text-right">{dayTotal.toFixed(1)}h</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day-by-Day Descriptions */}
                  {plan.dayDescriptions && (
                    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                        <span>📖</span> Day-by-Day Guide
                      </h4>
                      <div className="space-y-3">
                        {plan.days.map((day) => (
                          <div key={day.day} className="bg-slate-700 rounded-lg p-4 border-l-4 border-purple-500">
                            <h5 className="font-semibold text-white mb-2 text-lg">{day.day}</h5>
                            <p className="text-slate-300 leading-relaxed">{plan.dayDescriptions![day.day]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Study Tips */}
                  {plan.studyTips && (
                    <div className="bg-gradient-to-r from-green-900 to-emerald-900 border border-green-700 rounded-lg p-6">
                      <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
                        <span>💡</span> Study Tips & Strategies
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {plan.studyTips.map((tip, idx) => (
                          <div key={idx} className="bg-slate-700 bg-opacity-50 rounded p-3 flex gap-3">
                            <span className="text-green-400 font-bold text-lg flex-shrink-0">{idx + 1}.</span>
                            <p className="text-slate-200 text-sm leading-relaxed">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
