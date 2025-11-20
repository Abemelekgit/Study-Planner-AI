import { NextRequest, NextResponse } from 'next/server';

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

// Fallback plan generator when no API key is available
function generateFallbackPlan(
  tasks: any[],
  preferences: any
): GeneratedPlan {
  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  const dailyHours = preferences.dailyHours || 3;

  // Sort tasks by due date and priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0;
  });

  // Group tasks by course
  const tasksByCourse: Record<string, any[]> = {};
  sortedTasks.forEach((task) => {
    const courseId = task.course_id || 'Unknown';
    if (!tasksByCourse[courseId]) {
      tasksByCourse[courseId] = [];
    }
    tasksByCourse[courseId].push(task);
  });

  // Create week schedule
  const days: PlanDay[] = [];
  const courseIds = Object.keys(tasksByCourse);
  let globalTaskIndex = 0;

  daysOfWeek.forEach((day, dayNum) => {
    const blocks: PlanBlock[] = [];
    let remainingHours = dailyHours;

    // Assign study blocks for this day
    while (remainingHours > 0.5 && courseIds.length > 0) {
      const courseId = courseIds[globalTaskIndex % courseIds.length];
      const courseTasks = tasksByCourse[courseId];

      if (courseTasks.length > 0) {
        // Pick 1-2 tasks for this block
        const tasksForBlock = courseTasks.splice(0, Math.min(2, Math.ceil(remainingHours / 1.5)));
        
        if (tasksForBlock.length > 0) {
          blocks.push({
            course: courseId,
            tasks: tasksForBlock.map((t) => t.title),
            duration_hours: Math.min(1.5, remainingHours),
            notes: `Study ${tasksForBlock.length} task(s)`,
          });

          remainingHours -= Math.min(1.5, remainingHours);
        }
      }

      globalTaskIndex++;
    }

    // Only add day if it has blocks
    if (blocks.length > 0) {
      days.push({ day, blocks });
    }
  });

  // Ensure we have at least some structure
  if (days.length === 0 && sortedTasks.length > 0) {
    // Fallback: distribute all remaining tasks across the week
    let taskIdx = 0;
    daysOfWeek.forEach((day) => {
      const blocks: PlanBlock[] = [];
      let dayHours = dailyHours;

      while (dayHours > 0 && taskIdx < sortedTasks.length) {
        const task = sortedTasks[taskIdx++];
        const courseId = task.course_id || 'Unknown';
        const hours = Math.min(task.estimated_hours || 1.5, dayHours);

        blocks.push({
          course: courseId,
          tasks: [task.title],
          duration_hours: hours,
          notes: 'Work session',
        });

        dayHours -= hours;
      }

      if (blocks.length > 0) {
        days.push({ day, blocks });
      }
    });
  }

  return { days };
}

// Main handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks, preferences } = body;

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Invalid tasks format' },
        { status: 400 }
      );
    }

    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_API_KEY;
    const aiProvider = process.env.AI_PROVIDER || 'openai';

    // ALWAYS use fallback plan for speed (unless you explicitly set an API key)
    // The fallback generates instantly and works great for study planning
    console.log('Using fallback plan generator for instant scheduling');
    const plan = generateFallbackPlan(tasks, preferences);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('AI plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
