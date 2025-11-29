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
  const [dailyHoursInput, setDailyHoursInput] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [useAIEnhancement, setUseAIEnhancement] = useState(true);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [savedPlans, setSavedPlans] = useState<Array<{ id: string; title: string; created_at: string; plan_json?: any }>>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [blockExplanation, setBlockExplanation] = useState<string | null>(null);
  const [explainingBlock, setExplainingBlock] = useState<null | { dayIndex: number; blockIndex: number }>(null);

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

    console.log('analytics:event', { action: 'generate_plan', user: user?.id });

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
          useAI: useAIEnhancement,
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

  // Save current plan to localStorage
  const savePlanToLocal = () => {
    if (!plan) return;
    try {
      window.localStorage.setItem('studyplanner:last_plan', JSON.stringify({ plan, savedAt: new Date().toISOString() }));
      // small user feedback
      setError('Plan saved locally');
      setTimeout(() => setError(''), 2000);
    } catch (err) {
      console.error('Failed to save plan locally', err);
      setError('Failed to save plan locally');
    }
  };

  // Save current plan to the server (Supabase)
  const savePlanToServer = async () => {
    if (!plan || !user) {
      setError('No plan or user available to save');
      setTimeout(() => setError(''), 2500);
      return;
    }

    try {
      setError('');
      setSuccessMessage('');
      const resp = await fetch('/api/plans/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, title: `Plan ${new Date().toISOString()}`, plan }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || 'Failed to save plan to server');
        setTimeout(() => setError(''), 3000);
        return;
      }

      setSuccessMessage('Plan saved to server successfully');
      console.log('analytics:event', { action: 'save_plan_server', user: user?.id });
      setTimeout(() => setSuccessMessage(''), 3000);
      console.log('Saved plan to server:', data);
    } catch (err) {
      console.error('Save to server failed', err);
      setError('Save to server failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Load saved plans for current user from server
  const loadSavedPlans = async () => {
    if (!user) {
      setError('Not authenticated');
      setTimeout(() => setError(''), 2000);
      return;
    }

    try {
      const resp = await fetch(`/api/plans/list?user_id=${encodeURIComponent(user.id)}`);
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || 'Failed to load saved plans');
        setTimeout(() => setError(''), 2500);
        return;
      }
      setSavedPlans(data.plans || []);
      console.log('analytics:event', { action: 'list_saved_plans', user: user.id });
    } catch (err) {
      console.error('Failed to fetch saved plans', err);
      setError('Failed to fetch saved plans');
      setTimeout(() => setError(''), 2500);
    }
  };

  const loadSavedPlan = (planEntry: any) => {
    if (!planEntry || !planEntry.plan_json) {
      setError('Invalid saved plan');
      setTimeout(() => setError(''), 2000);
      return;
    }
    setPlan(planEntry.plan_json);
    setSuccessMessage(`Loaded plan: ${planEntry.title}`);
    setTimeout(() => setSuccessMessage(''), 2500);
    console.log('analytics:event', { action: 'load_saved_plan', user: user?.id, planId: planEntry.id });
  };

  const deleteSavedPlan = async (planId: string) => {
    if (!user) return;
    try {
      const resp = await fetch('/api/plans/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, user_id: user.id }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data.error || 'Failed to delete plan');
        setTimeout(() => setError(''), 2500);
        return;
      }
      setSavedPlans((s) => s.filter(p => p.id !== planId));
      setSuccessMessage('Deleted saved plan');
      setTimeout(() => setSuccessMessage(''), 2000);
      console.log('analytics:event', { action: 'delete_saved_plan', user: user.id, planId });
    } catch (err) {
      console.error('Delete plan failed', err);
      setError('Delete plan failed');
      setTimeout(() => setError(''), 2500);
    }
  };

  // Load last saved plan from localStorage
  const loadPlanFromLocal = () => {
    try {
      const raw = window.localStorage.getItem('studyplanner:last_plan');
      if (!raw) {
        setError('No local plan found');
        setTimeout(() => setError(''), 2000);
        return;
      }
      const obj = JSON.parse(raw);
      setPlan(obj.plan);
      setError('Loaded plan from local storage');
      setTimeout(() => setError(''), 2000);
    } catch (err) {
      console.error('Failed to load plan locally', err);
      setError('Failed to load plan');
    }
  };

  // Clear saved plan from localStorage
  const clearLocalPlan = () => {
    try {
      window.localStorage.removeItem('studyplanner:last_plan');
      setError('Local plan cleared');
      setTimeout(() => setError(''), 2000);
    } catch (err) {
      console.error('Failed to clear local plan', err);
      setError('Failed to clear local plan');
    }
  };

  // Move a block left (-1) or right (+1) across days
  const moveBlock = (dayIndex: number, blockIndex: number, direction: -1 | 1) => {
    if (!plan) return;
    const newPlan = structuredClone(plan);
    const targetDay = dayIndex + direction;
    if (targetDay < 0 || targetDay >= newPlan.days.length) return;

    const [block] = newPlan.days[dayIndex].blocks.splice(blockIndex, 1);
    newPlan.days[targetDay].blocks.push(block);
    setPlan(newPlan);
  };

  // Promote priority (bump priority label for the first task in a block)
  const promoteBlockPriority = (dayIndex: number, blockIndex: number) => {
    if (!plan) return;
    const priorities = ['low', 'normal', 'medium', 'high', 'urgent'];
    const newPlan = structuredClone(plan);
    const block = newPlan.days[dayIndex].blocks[blockIndex];
    // We don't have original priority on block tasks here; just set a note or increase notes marker
    block.notes = (block.notes || '') + ' | priority-increased';
    setPlan(newPlan);
  };

  const explainBlock = async (dayIndex: number, blockIndex: number) => {
    if (!plan) return;
    setExplainingBlock({ dayIndex, blockIndex });
    setBlockExplanation(null);
    const block = plan.days[dayIndex].blocks[blockIndex];
    try {
      const resp = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course: block.course, tasks: block.tasks, duration_hours: block.duration_hours, notes: block.notes }),
      });
      const data = await resp.json();
      setBlockExplanation(data.explanation || data.error || 'No explanation available');
    } catch (err) {
      setBlockExplanation('Failed to fetch explanation');
      console.error(err);
    } finally {
      setExplainingBlock(null);
    }
  };

  // Keyboard shortcut: press 'g' to generate plan
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'g' && !generating) {
        const fakeEvent = { preventDefault: () => {} } as unknown as React.FormEvent;
        // Trigger form submit programmatically
        // Note: this uses the existing handleGeneratePlan function
        handleGeneratePlan(fakeEvent);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generating, tasks, dailyHours]);

  // Debounce dailyHours updates when user types quickly
  useEffect(() => {
    const t = setTimeout(() => setDailyHours(dailyHoursInput), 350);
    return () => clearTimeout(t);
  }, [dailyHoursInput]);

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
      <main className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute top-40 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute -bottom-8 right-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="mb-12">
            <h1 className="text-6xl font-black mb-4 leading-tight">
              <span className="gradient-text">AI Study Planner</span>
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl">Generate intelligent, personalized weekly study schedules powered by smart task prioritization and AI insights.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-8 glass-card p-4 border-l-4 border-red-500 bg-red-500/10 animate-in slide-in-from-top">
              <p className="text-red-200 font-medium">⚠️ {error}</p>
            </div>
          )}
                  {successMessage && (
                    <div role="status" aria-live="polite" className="mb-4 glass-card p-3 border-l-4 border-emerald-400 bg-emerald-400/5">
                      <p className="text-emerald-200 font-medium">✅ {successMessage}</p>
                    </div>
                  )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-1">
              <div className="glass-card p-8 space-y-6 border border-white/10 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.5 1.5H3.75A2.25 2.25 0 001.5 3.75v12.5A2.25 2.25 0 003.75 18.5h12.5a2.25 2.25 0 002.25-2.25V9.5M10.5 1.5v8m0-8L15 6M6 10h8M6 13h5" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-white">Study Preferences</h2>
                </div>

                <form onSubmit={handleGeneratePlan} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-3 uppercase tracking-wider">
                      Daily Study Hours
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        step="0.5"
                        value={dailyHoursInput}
                        onChange={(e) => setDailyHoursInput(parseFloat(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
                      />
                      <span className="absolute right-4 top-3 text-slate-400 font-medium">hrs</span>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-3 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={useAIEnhancement}
                        onChange={(e) => setUseAIEnhancement(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Enhance plan using AI</span>
                    </label>
                  </div>

                    {/* Block Explanation Panel */}
                    {blockExplanation && (
                      <div className="glass-card p-6 border border-white/10">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-white font-semibold">Block Explanation</h4>
                          <button onClick={() => setBlockExplanation(null)} className="text-sm text-slate-300 hover:text-white">Close</button>
                        </div>
                        <p className="text-slate-200 text-sm leading-relaxed">{blockExplanation}</p>
                      </div>
                    )}

                  {/* Task Counter Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                    <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Tasks Ready</p>
                    <p className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{tasks.length}</p>
                  </div>

                  {/* Generate Button */}
                  <button
                    type="submit"
                    disabled={generating || tasks.length === 0}
                    className="w-full relative group overflow-hidden rounded-xl px-6 py-3 font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-100 group-hover:opacity-90 group-disabled:opacity-50 transition-opacity"></div>
                    <span className="relative flex items-center justify-center gap-2">
                      {generating ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Plan
                        </>
                      )}
                    </span>
                  </button>

                  {/* Export Button */}
                  {plan && (
                    <button
                      type="button"
                      onClick={handleExportPlan}
                      className="w-full group overflow-hidden rounded-xl px-6 py-3 font-semibold text-white transition-all duration-300 border border-green-500/50 hover:border-green-400 bg-green-500/10 hover:bg-green-500/20"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Export as Text
                      </span>
                    </button>
                  )}
                  {plan && (
                    <button
                      type="button"
                      onClick={savePlanToLocal}
                      className="w-full mt-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold"
                    >
                      💾 Save Plan (Local)
                    </button>
                  )}
                  {/* Quick load saved plans from server */}
                  <button
                    type="button"
                    onClick={loadSavedPlans}
                    className="w-full mt-2 px-6 py-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-semibold"
                  >
                    🔃 Load Saved Plans
                  </button>
                  {plan && (
                    <button
                      type="button"
                      onClick={savePlanToServer}
                      className="w-full mt-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold"
                      aria-label="Save plan to server"
                    >
                      ☁️ Save Plan (Server)
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={loadPlanFromLocal}
                    className="w-full mt-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium"
                    aria-label="Load plan from local storage"
                  >
                    📂 Load Last Plan
                  </button>
                </form>
              </div>
            </div>

            {/* Plan Display Section */}
            <div className="lg:col-span-3">
              {/* Saved Plans Panel (server-saved plans) */}
              {savedPlans && savedPlans.length > 0 && (
                <div className="glass-card p-4 mb-6 border border-white/10">
                  <h4 className="font-bold text-white mb-3">Saved Plans</h4>
                  <div className="space-y-2">
                    {savedPlans.map((p) => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-800/40 p-3 rounded">
                        <div>
                          <div className="text-white font-semibold">{p.title}</div>
                          <div className="text-slate-400 text-xs">{new Date(p.created_at).toLocaleString()}</div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => loadSavedPlan(p)} className="px-3 py-1 bg-indigo-600 rounded text-white text-sm" aria-label={`Load saved plan ${p.title}`}>
                            Load
                          </button>
                          <button onClick={() => deleteSavedPlan(p.id)} className="px-3 py-1 bg-red-600 rounded text-white text-sm" aria-label={`Delete saved plan ${p.title}`}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!plan ? (
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
                  <p className="text-slate-400 mb-4 text-lg">
                    👋 No plan generated yet
                  </p>
                  <p className="text-slate-400">
                    Adjust your preferences and click "Generate Plan" to create your AI-powered weekly study schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {/* Plan Summary */}
                  {plan.summary && (
                    <div className="glass-card p-8 border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                      <div className="relative">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-3 text-xl">
                          <span className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                          </span>
                          Study Plan Overview
                        </h3>
                        <div className="flex items-center gap-3">
                          <p className="text-slate-300 leading-relaxed text-sm">{plan.summary}</p>
                          {plan.summary && plan.summary.includes('[AI Summary]') && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 rounded bg-indigo-600 text-xs text-white">AI enhanced</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Weekly Plan Table */}
                  <div className="glass-card overflow-hidden border border-white/10">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border-b border-white/10">
                            <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Day</th>
                            <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Course</th>
                            <th className="px-6 py-4 text-left font-bold text-white uppercase tracking-wider text-xs">Tasks</th>
                            <th className="px-6 py-4 text-center font-bold text-white uppercase tracking-wider text-xs">Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          {plan.days.map((planDay, dayIndex) => (
                            planDay.blocks.map((block, blockIndex) => (
                              <tr
                                key={`${dayIndex}-${blockIndex}`}
                                className="border-b border-white/10 hover:bg-white/5 transition-colors duration-300 group"
                              >
                                {/* Day - only show on first block of the day */}
                                {blockIndex === 0 ? (
                                  <td className="px-6 py-4 font-semibold text-white align-top">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 group-hover:scale-125 transition-transform"></div>
                                      <span className="font-bold">{planDay.day}</span>
                                    </div>
                                  </td>
                                ) : (
                                  <td className="px-6 py-4"></td>
                                )}

                                {/* Course Name */}
                                <td className="px-6 py-4">
                                  <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 text-xs font-semibold border border-purple-500/30 group-hover:border-purple-500/60 transition-colors">
                                    {block.course}
                                  </span>
                                </td>

                                {/* Tasks List */}
                                <td className="px-6 py-4">
                                  <ul className="space-y-2">
                                    {block.tasks.map((task, idx) => (
                                      <li key={idx} className="flex items-start gap-3">
                                        <span className="text-blue-400 font-bold mt-0.5 text-lg">→</span>
                                        <span className="text-slate-200 group-hover:text-white transition-colors">{task}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </td>

                                {/* Duration */}
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 font-bold text-sm border border-green-500/30 group-hover:border-green-500/60 transition-colors">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-.707.707a1 1 0 101.414 1.414L9 10.414V6z" clipRule="evenodd" />
                                    </svg>
                                    {block.duration_hours.toFixed(1)}h
                                  </span>
                                </td>
                                  {/* Actions */}
                                  <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => moveBlock(dayIndex, blockIndex, -1)}
                                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm"
                                        title="Move to previous day"
                                        aria-label={`Move block ${dayIndex}-${blockIndex} to previous day`}
                                      >
                                        ←
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => moveBlock(dayIndex, blockIndex, 1)}
                                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm"
                                        title="Move to next day"
                                        aria-label={`Move block ${dayIndex}-${blockIndex} to next day`}
                                      >
                                        →
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => promoteBlockPriority(dayIndex, blockIndex)}
                                        className="px-2 py-1 rounded bg-yellow-600 hover:bg-yellow-500 text-sm text-white"
                                        title="Increase priority"
                                        aria-label={`Increase priority for block ${dayIndex}-${blockIndex}`}
                                      >
                                        ⬆
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => explainBlock(dayIndex, blockIndex)}
                                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white"
                                        title="Get explanation"
                                        aria-label={`Explain block ${dayIndex}-${blockIndex}`}
                                      >
                                        {explainingBlock && explainingBlock.dayIndex === dayIndex && explainingBlock.blockIndex === blockIndex ? '...' : '💬'}
                                      </button>
                                    </div>
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
                    <div className="glass-card p-6 border border-white/10 hover:border-blue-500/50 transition-all duration-300 group cursor-default">
                      <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Days Planned</p>
                      <div className="flex items-end justify-between">
                        <p className="text-4xl font-black bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">{plan.days.length}</p>
                        <svg className="w-12 h-12 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      </div>
                    </div>

                    <div className="glass-card p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 group cursor-default">
                      <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Study Sessions</p>
                      <div className="flex items-end justify-between">
                        <p className="text-4xl font-black bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                          {plan.days.reduce((sum, day) => sum + day.blocks.length, 0)}
                        </p>
                        <svg className="w-12 h-12 text-purple-500/20 group-hover:text-purple-500/40 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    <div className="glass-card p-6 border border-white/10 hover:border-green-500/50 transition-all duration-300 group cursor-default">
                      <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Total Hours</p>
                      <div className="flex items-end justify-between">
                        <p className="text-4xl font-black bg-gradient-to-r from-green-400 to-green-500 bg-clip-text text-transparent">
                          {plan.days
                            .reduce((sum, day) => sum + day.blocks.reduce((bSum, b) => bSum + b.duration_hours, 0), 0)
                            .toFixed(1)}
                        </p>
                        <svg className="w-12 h-12 text-green-500/20 group-hover:text-green-500/40 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00-.293.707l-.707.707a1 1 0 101.414 1.414L9 10.414V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    <div className="glass-card p-6 border border-white/10 hover:border-orange-500/50 transition-all duration-300 group cursor-default">
                      <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-3">Courses</p>
                      <div className="flex items-end justify-between">
                        <p className="text-4xl font-black bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                          {new Set(plan.days.flatMap(day => day.blocks.map(b => b.course))).size}
                        </p>
                        <svg className="w-12 h-12 text-orange-500/20 group-hover:text-orange-500/40 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5.951-1.429 5.951 1.429a1 1 0 001.169-1.409l-7-14z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Daily Breakdown with Progress Bars */}
                  <div className="glass-card p-8 border border-white/10">
                    <h4 className="font-bold text-white mb-6 flex items-center gap-3 text-lg">
                      <span className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                      </span>
                      Daily Breakdown
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {plan.days.map((day, idx) => {
                        const dayTotal = day.blocks.reduce((sum, b) => sum + b.duration_hours, 0);
                        const percentFilled = Math.min((dayTotal / dailyHours) * 100, 100);
                        return (
                          <div key={idx} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-semibold text-white">{day.day}</span>
                              <span className="text-sm font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">{dayTotal.toFixed(1)}h / {dailyHours}h</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-lg shadow-purple-500/50 transition-all duration-500"
                                style={{ width: `${percentFilled}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Day-by-Day Descriptions */}
                  {plan.dayDescriptions && (
                    <div className="glass-card p-8 border border-white/10">
                      <h4 className="font-bold text-white mb-6 flex items-center gap-3 text-lg">
                        <span className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011-1h8a1 1 0 011 1v12a1 1 0 11-2 0V3H7v12a1 1 0 11-2 0V2z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Day-by-Day Guide
                      </h4>
                      <div className="space-y-4">
                        {plan.days.map((day) => (
                          <div key={day.day} className="group p-5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300">
                            <h5 className="font-bold text-white mb-3 text-base flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 group-hover:scale-150 transition-transform"></span>
                              {day.day}
                            </h5>
                            <p className="text-slate-300 leading-relaxed text-sm group-hover:text-slate-200 transition-colors">{plan.dayDescriptions![day.day]}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Study Tips */}
                  {plan.studyTips && (
                    <div className="glass-card p-8 border border-white/10 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500"></div>
                      <div className="relative">
                        <h4 className="font-bold text-white mb-6 flex items-center gap-3 text-lg">
                          <span className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </span>
                          Study Tips & Strategies
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {plan.studyTips.map((tip, idx) => (
                            <div key={idx} className="p-4 rounded-xl bg-white/5 border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all duration-300 group/tip">
                              <div className="flex gap-4">
                                <span className="text-2xl font-black bg-gradient-to-br from-green-400 to-emerald-500 bg-clip-text text-transparent flex-shrink-0 group-hover/tip:scale-110 transition-transform">{idx + 1}</span>
                                <p className="text-slate-200 text-sm leading-relaxed group-hover/tip:text-white transition-colors">{tip}</p>
                              </div>
                            </div>
                          ))}
                        </div>
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
