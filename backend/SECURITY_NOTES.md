# Backend Security Notes

## Sprint 42 scope

- Keep `FixedAIProvider` as the default provider for this sprint.
- Do not set or use `OPENAI_API_KEY` in this sprint.
- Use backend bearer auth token only via `process.env.HEALTH_PILOT_BACKEND_TOKEN`.

## OpenAI activation policy for next sprint

When enabling OpenAI in a future sprint:

- Use a Health Pilot dedicated OpenAI Project.
- Use a development-only OpenAI API key.
- Read key only from `process.env.OPENAI_API_KEY`.
- Read model only from `process.env.OPENAI_MODEL`.
- Configure low monthly budget and alerts in OpenAI Project settings.
- Do not store keys in GitHub, app source, Expo settings, or logs.
- Revoke and reissue immediately on suspected leakage.
