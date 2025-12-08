import { NextRequest, NextResponse } from 'next/server';

// Generate an expanded explanation for a single plan block (course + tasks).
// If AI_API_KEY is configured, this will call OpenAI to produce a natural, helpful paragraph.
// Updated: Dec 8, 2025 - Enhanced fallback messaging
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { course, tasks, duration_hours, notes } = body;

    if (!course || !Array.isArray(tasks)) {
      return NextResponse.json({ error: 'Invalid block payload. Expect { course, tasks[] }' }, { status: 400 });
    }

    const openaiKey = process.env.AI_API_KEY;
    if (openaiKey) {
      try {
        const prompt = `Write a helpful 3-4 sentence study guidance for this study block. Course: ${course}. Tasks: ${tasks.join(', ')}. Estimated duration: ${duration_hours} hours. Notes: ${notes || 'none'}. Give actionable tips and how to sequence the tasks.`;

        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: process.env.AI_MODEL || 'gpt-4o-mini',
            messages: [
              { role: 'system', content: 'You provide concise study guidance and sequencing suggestions.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 220,
            temperature: 0.7,
          }),
        });

        if (resp.ok) {
          const json = await resp.json();
          const text = json?.choices?.[0]?.message?.content;
          return NextResponse.json({ explanation: text || null });
        }

        const errText = await resp.text();
        console.warn('[Explain API] OpenAI error:', errText);
      } catch (err) {
        console.warn('[Explain API] OpenAI call failed:', err);
      }
    }

  // Fallback explanation generator (deterministic)
  // Note: If no AI_API_KEY is configured or the OpenAI call fails, we return this deterministic guidance so the planner still provides useful suggestions.
  // This fallback is kept intentionally simple and deterministic for reliability and testability.
    const firstTasks = Array.isArray(tasks) ? tasks.slice(0, 3).join(', ') : '';
    const hrs = typeof duration_hours === 'number' ? duration_hours.toFixed(1) : 'an appropriate amount of';
    const moreNote = Array.isArray(tasks) && tasks.length > 3 ? `, and ${tasks.length - 3} more task(s)` : '';

    const explanation = `(Fallback) For ${course} spend about ${hrs} hour(s). Start with: ${firstTasks}${moreNote}. Break work into focused 25–50 minute sessions and review notes after each session. Prioritize harder tasks first.`;

    return NextResponse.json({ explanation, fallback: true });
  } catch (err) {
    console.error('[Explain API] error:', err);
    return NextResponse.json({ error: 'Failed to generate explanation' }, { status: 500 });
  }
}
