type OpenAIOptions = {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  timeoutMs?: number;
  retries?: number;
};

async function timeoutPromise<T>(ms: number, p: Promise<T>): Promise<T> {
  const timeout = new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('OpenAI request timed out')), ms));
  return Promise.race([p, timeout]);
}

export async function callOpenAI(messages: any[], opts: OpenAIOptions = {}) {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error('AI_API_KEY not configured');

  const model = opts.model || process.env.AI_MODEL || 'gpt-4o-mini';
  const max_tokens = opts.max_tokens ?? Number(process.env.AI_MAX_TOKENS) || 400;
  const temperature = opts.temperature ?? Number(process.env.AI_TEMPERATURE) || 0.7;
  const timeoutMs = opts.timeoutMs ?? Number(process.env.AI_TIMEOUT_MS) || 8000;
  const retries = Math.max(1, opts.retries ?? Number(process.env.AI_RETRIES) || 2);

  let lastError: any = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await timeoutPromise(timeoutMs, fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ model, messages, max_tokens, temperature }),
      }));

      const text = await resp.text();
      // Try to parse JSON, otherwise return raw text wrapper
      let json: any = null;
      try { json = JSON.parse(text); } catch (_) { json = { raw: text }; }

      if (!resp.ok) {
        const err = new Error(`OpenAI error: ${resp.status}`);
        (err as any).response = json;
        throw err;
      }

      return json;
    } catch (err) {
      lastError = err;
      // quick backoff
      await new Promise(r => setTimeout(r, 200 * attempt));
    }
  }

  throw lastError;
}

export default callOpenAI;
