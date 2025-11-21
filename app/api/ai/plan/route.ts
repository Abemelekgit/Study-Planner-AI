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

// Priority levels for task scheduling
function getPriorityScore(task: any): number {
  const priorityMap: Record<string, number> = {
    'high': 30,
    'urgent': 40,
    'medium': 20,
    'low': 10,
    'normal': 15
  };
  
  let score = priorityMap[task.priority?.toLowerCase()] || 15;
  
  // Boost score if due date is soon
  if (task.due_date) {
    const dueDate = new Date(task.due_date);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 1) score += 50;  // Due today or tomorrow
    else if (daysUntilDue <= 3) score += 30;  // Due this week
    else if (daysUntilDue <= 7) score += 15;  // Due next week
  }
  
  return score;
}

// Enhanced plan generator with smart task scheduling
function generateSmartPlan(tasks: any[], preferences: any): GeneratedPlan {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dailyHours = preferences.dailyHours || 3;
  
  // Sort tasks by priority and due date
  const sortedTasks = [...tasks].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
  
  const planDays: PlanDay[] = [];
  let taskIndex = 0;

  days.forEach((day) => {
    if (taskIndex >= sortedTasks.length) return; // No more tasks

    const blocks: PlanBlock[] = [];
    let hoursLeft = dailyHours;
    let dayTasks = [];

    // Assign tasks to this day based on priority
    while (hoursLeft > 0.5 && taskIndex < sortedTasks.length) {
      dayTasks.push(sortedTasks[taskIndex]);
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
        const blockHours = Math.min(dailyHours, courseTasks.length * 1.5);
        blocks.push({
          course: courseName,
          tasks: courseTasks.map((t: any) => t.title),
          duration_hours: blockHours,
          notes: `${courseTasks.length} task(s) | Priority: ${courseTasks[0]?.priority || 'normal'}`,
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
  const { summary, dayDescriptions, studyTips } = generatePlanDescription(basePlan, sortedTasks, preferences);

  return { 
    days: planDays,
    summary,
    dayDescriptions,
    studyTips
  };
}

// Main handler with enhanced validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tasks, preferences } = body;

    // Validate tasks
    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'Invalid tasks format. Expected an array of tasks.' },
        { status: 400 }
      );
    }

    if (tasks.length === 0) {
      return NextResponse.json(
        { error: 'No tasks provided. Please add tasks before generating a plan.' },
        { status: 400 }
      );
    }

    // Validate task structure
    const invalidTasks = tasks.filter(t => !t.title || !t.course_id);
    if (invalidTasks.length > 0) {
      return NextResponse.json(
        { error: `${invalidTasks.length} task(s) missing required fields (title, course_id)` },
        { status: 400 }
      );
    }

    // Validate preferences
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences format. Expected an object with study preferences.' },
        { status: 400 }
      );
    }

    if (!preferences.dailyHours || preferences.dailyHours <= 0) {
      return NextResponse.json(
        { error: 'Invalid daily hours preference. Must be greater than 0.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_API_KEY;
    const aiProvider = process.env.AI_PROVIDER || 'openai';

    // Use smart plan generator with priority-based scheduling
    console.log(`[AI Plan] Generating smart plan for ${tasks.length} tasks with ${preferences.dailyHours}h daily preference`);
    const plan = generateSmartPlan(tasks, preferences);
    console.log(`[AI Plan] Plan generated successfully with ${plan.days.length} study days`);
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('[AI Plan] Generation error:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate study plan. Please try again.' },
      { status: 500 }
    );
  }
}
