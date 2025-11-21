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
  summary: string;
  dayDescriptions: Record<string, string>;
  studyTips: string[];
}

// Generate written description for the plan
function generatePlanDescription(plan: { days: PlanDay[] }, tasks: any[], preferences: any): { summary: string; dayDescriptions: Record<string, string>; studyTips: string[] } {
  const totalHours = plan.days.reduce((sum, day) => sum + day.blocks.reduce((bSum, b) => bSum + b.duration_hours, 0), 0);
  const totalTasks = tasks.length;
  const uniqueCourses = new Set(plan.days.flatMap(day => day.blocks.map(b => b.course))).size;
  const avgSessionDuration = totalHours / plan.days.length;

  // Generate summary
  const summary = `This study plan spreads ${totalTasks} tasks across ${plan.days.length} days, totaling ${totalHours.toFixed(1)} hours of focused study time. You'll be studying approximately ${avgSessionDuration.toFixed(1)} hours per day with content from ${uniqueCourses} course(s). The plan is designed to balance your workload evenly while respecting your ${preferences.dailyHours} hour daily study preference.`;

  // Generate day-by-day descriptions
  const dayDescriptions: Record<string, string> = {};
  
  plan.days.forEach(day => {
    const courseList = day.blocks.map(b => b.course).join(' and ');
    const taskCount = day.blocks.reduce((sum, b) => sum + b.tasks.length, 0);
    const dayHours = day.blocks.reduce((sum, b) => sum + b.duration_hours, 0);
    
    let description = `${day.day}: Focus on ${courseList} with ${taskCount} task${taskCount !== 1 ? 's' : ''} (${dayHours.toFixed(1)} hours). `;
    
    // Add specific task descriptions
    const specificTasks = day.blocks.flatMap(b => 
      b.tasks.map(t => `${b.course}: ${t}`)
    );
    
    if (specificTasks.length > 0) {
      description += `Tasks include: ${specificTasks.slice(0, 3).join(', ')}${specificTasks.length > 3 ? `, and ${specificTasks.length - 3} more` : ''}. `;
    }
    
    // Add strategy tip
    if (day.blocks.length > 1) {
      description += `You have multiple subjects today, so try the Pomodoro technique to switch between courses effectively.`;
    } else if (dayHours > preferences.dailyHours * 0.8) {
      description += `This is a busy day - make sure to take short breaks every 25-30 minutes.`;
    } else {
      description += `This is a lighter day - use it to consolidate learning or get ahead on upcoming tasks.`;
    }
    
    dayDescriptions[day.day] = description;
  });

  // Generate study tips
  const studyTips = [
    `Study consistently at the same time each day to build a routine. Aim for ${preferences.dailyHours} hours daily as planned.`,
    `Use the Pomodoro Technique: Study for 25 minutes, take a 5-minute break, then repeat. After 4 cycles, take a 15-minute break.`,
    `Break complex tasks into smaller subtasks. This makes progress visible and keeps motivation high.`,
    `The spacing effect works best when you review material after 1 day, 3 days, and 1 week. Plan reviews accordingly.`,
    `Group similar subjects together when possible to maintain context and reduce cognitive switching costs.`,
    `Complete harder or more important tasks early in the day when your mental energy is highest.`,
    `Track completed tasks to visualize progress. Even small wins contribute to motivation.`
  ];

  return { summary, dayDescriptions, studyTips };
}

// Simple, fast plan generator
function generateSimplePlan(tasks: any[], preferences: any): GeneratedPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dailyHours = preferences.dailyHours || 3;
  
  const planDays: PlanDay[] = [];
  let taskIndex = 0;

  days.forEach((day) => {
    if (taskIndex >= tasks.length) return; // No more tasks

    const blocks: PlanBlock[] = [];
    let hoursLeft = dailyHours;
    let dayTasks = [];

    // Assign tasks to this day
    while (hoursLeft > 0.5 && taskIndex < tasks.length) {
      dayTasks.push(tasks[taskIndex]);
      taskIndex++;
      hoursLeft -= 1.5;
    }

    // Create blocks for all tasks on this day
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
  });

  // Generate descriptions
  const basePlan = { days: planDays };
  const { summary, dayDescriptions, studyTips } = generatePlanDescription(basePlan, tasks, preferences);

  return { 
    days: planDays,
    summary,
    dayDescriptions,
    studyTips
  };
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
