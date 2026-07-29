# Health Pilot

Health Pilot collects everything.
Thinks through everything.
Shows only what matters.

Your only job is to decide.

Health Pilot is a personal AI health copilot that turns daily health data into one clear action.

## What it does

- Distills health context into one daily mission
- Keeps the experience calm and action-first
- Supports simple, daily decision-making without adding dashboard noise

## Principles

- Mission first
- Reason second
- Data third

## Product focus

Health Pilot is not a dashboard.
It is not a health tracker.
It is an AI health copilot designed to help people decide what to do today.

## Development security notes

- The backend development server listens on `0.0.0.0` by default, so devices on the same LAN can reach it.
- Keep this only for local development. Do not expose this backend to the internet.
- Backend API authentication for app-to-backend calls uses `HEALTH_PILOT_BACKEND_TOKEN`.
- `HEALTH_PILOT_BACKEND_TOKEN` is a backend access token and must be managed separately from OpenAI credentials.
