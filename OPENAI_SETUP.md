OpenAI Integration (optional)
=================================

To enable richer AI-generated summaries and per-block explanations, set the following environment variables in your `.env.local` file (or your deployment environment):

- AI_API_KEY — your OpenAI API key (secret)
- AI_MODEL — optional model name (defaults to `gpt-4o-mini` in the code)
- AI_PROVIDER — optional provider flag (defaults to `openai`)

Example `.env.local` entries:

```
AI_API_KEY=sk-....
AI_MODEL=gpt-4o-mini
AI_PROVIDER=openai
```
Note: you can set AI_MODEL to choose a model (for example: AI_MODEL=gpt-4o-mini). If unspecified, the server falls back to a sensible default.

Implementation notes: The server will attempt to contact OpenAI and may retry a few times on transient failures. The helper in `lib/openaiClient.ts` uses a short timeout (default 8s) and retries (default 2). You can tune `AI_MODEL` and other options via env vars (for example `AI_TIMEOUT_MS` and `AI_RETRIES`).

After adding the key, restart the dev server. The planner will attempt to call OpenAI and attach enhanced summaries and explanations when available. If the key is not present, the planner falls back to deterministic summaries so it remains functional.

Tip (Dec 2, 2025): If you see occasional timeouts, increase `AI_TIMEOUT_MS` or `AI_RETRIES` in your environment to improve reliability.

Updated (Dec 8, 2025): Additional environment variables available for fine-tuning AI behavior.

Security note: Keep your API key secret — do NOT commit it to GitHub.
