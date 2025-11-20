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

  // Group tasks by course
  const tasksByCourse: Record<string, any[]> = {};
  tasks.forEach((task) => {
    const courseId = task.course_id || 'Unknown';
    if (!tasksByCourse[courseId]) {
      tasksByCourse[courseId] = [];
    }
    tasksByCourse[courseId].push(task);
  });

  // Create a simple distribution across the week
  const days: PlanDay[] = [];
  let taskIndex = 0;
  const courseIds = Object.keys(tasksByCourse);

  daysOfWeek.forEach((day) => {
    const blocks: PlanBlock[] = [];
    let remainingHours = dailyHours;

    // Distribute tasks across the week
    while (remainingHours > 0 && courseIds.length > 0) {
      const courseId = courseIds[taskIndex % courseIds.length];
      const courseTasks = tasksByCourse[courseId];

      if (courseTasks.length > 0) {
        const taskCount = Math.min(2, Math.ceil(remainingHours / 1.5));
        const selectedTasks = courseTasks.splice(0, taskCount).map((t) => t.title);

        blocks.push({
          course: courseId,
          tasks: selectedTasks,
          duration_hours: Math.min(1.5, remainingHours),
          notes: 'Focus block',
        });

        remainingHours -= Math.min(1.5, remainingHours);
      }

      taskIndex++;
    }

    if (blocks.length > 0) {
      days.push({ day, blocks });
    }
  });

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

    // If no API key, return fallback plan
    if (!apiKey) {
      console.warn('No AI_API_KEY set, using fallback plan generator');
      const plan = generateFallbackPlan(tasks, preferences);
      return NextResponse.json({ plan });
    }

    // Call OpenAI or compatible API
    if (aiProvider === 'openai' || aiProvider === 'anthropic') {
      const systemPrompt = `You are an AI study planning assistant. Generate a structured weekly study plan in JSON format.
Your response MUST be valid JSON only, with this exact structure:
{
  "days": [
    {
      "day": "Monday",
      "blocks": [
        {
          "course": "Course Name",
          "tasks": ["Task 1", "Task 2"],
          "duration_hours": 2,
          "notes": "Focus period"
        }
      ]
    }
  ]
}

Important: Return ONLY valid JSON, no explanations or markdown.`;

      const userPrompt = `Create a ${preferences.dailyHours || 3}-hour per day study plan for these tasks:
${tasks
  .map(
    (t: any) =>
      `- ${t.title} (${t.course_id}, estimated ${t.estimated_hours || 1} hour(s), due ${t.due_date || 'TBD'})`
  )
  .join('\n')}

Distribute tasks across Mon-Sun to optimize learning and meet deadlines.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status, response.statusText);
        // Fall back to default plan
        const plan = generateFallbackPlan(tasks, preferences);
        return NextResponse.json({ plan });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('No content in OpenAI response');
        const plan = generateFallbackPlan(tasks, preferences);
        return NextResponse.json({ plan });
      }

      // Parse the JSON response
      let plan: GeneratedPlan;
      try {
        plan = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse AI response as JSON:', content);
        plan = generateFallbackPlan(tasks, preferences);
      }

      return NextResponse.json({ plan });
    }

    // Unsupported provider
    return NextResponse.json(
      { error: `AI provider ${aiProvider} not supported` },
      { status: 400 }
    );
  } catch (error) {
    console.error('AI plan generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
