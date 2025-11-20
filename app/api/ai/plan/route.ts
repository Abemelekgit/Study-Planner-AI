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

// Simple, fast plan generator
function generateSimplePlan(tasks: any[], preferences: any): GeneratedPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dailyHours = preferences.dailyHours || 3;
  
  const planDays: PlanDay[] = [];
  let taskIndex = 0;

  for (const day of days) {
    const blocks: PlanBlock[] = [];
    let hoursLeft = dailyHours;
    let dayTasks = [];

    // Assign tasks to this day
    while (hoursLeft > 0.5 && taskIndex < tasks.length) {
      dayTasks.push(tasks[taskIndex]);
      taskIndex++;
      hoursLeft -= 1.5;
    }

    // Create a block for all tasks on this day
    if (dayTasks.length > 0) {
      // Group by course
      const tasksByCourse: Record<string, any[]> = {};
      dayTasks.forEach(t => {
        const cId = t.course_id || 'Unknown';
        if (!tasksByCourse[cId]) tasksByCourse[cId] = [];
        tasksByCourse[cId].push(t);
      });

      // Create a block per course
      Object.entries(tasksByCourse).forEach(([courseId, courseTasks]: [string, any[]]) => {
        const courseName = courseTasks[0]?.course_name || courseId || 'Study';
        blocks.push({
          course: courseName,
          tasks: courseTasks.map((t: any) => t.title),
          duration_hours: Math.min(dailyHours, courseTasks.length * 1.5),
          notes: `${courseTasks.length} task(s)`,
        });
      });

      planDays.push({
        day,
        blocks,
      });
    }

    if (taskIndex >= tasks.length) break;
  }

  return { days: planDays };
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

    // Use simple plan generator
    console.log('Generating plan for', tasks.length, 'tasks');
    const plan = generateSimplePlan(tasks, preferences);
    console.log('Plan generated with', plan.days.length, 'days');
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('AI plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
