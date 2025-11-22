OpenAI Integration (optional)
=================================

To enable richer AI-generated summaries and per-block explanations, set the following environment variables in your `.env.local` file (or your deployment environment):

- AI_API_KEY — your OpenAI API key (secret)
- AI_MODEL — optional model name (defaults to `gpt-4o-mini` in the code)

Example `.env.local` entries:

```
AI_API_KEY=sk-....
AI_MODEL=gpt-4o-mini
```

After adding the key, restart the dev server. The planner will attempt to call OpenAI and attach enhanced summaries and explanations when available. If the key is not present, the planner falls back to deterministic summaries so it remains functional.

Security note: Keep your API key secret — do NOT commit it to GitHub.
