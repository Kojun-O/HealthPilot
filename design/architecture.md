# Health Pilot Architecture v1

## Overview

Health Pilot transforms health data into daily action.

```
Health Data
      │
      ▼
Health Engine
      │
      ▼
Health AI Core
      │
      ▼
Today's Missions
      │
      ▼
Health Score
      │
      ▼
User Interface
```

---

## Data Sources

- Apple Health
- SOXAI Ring
- Manual Input
- Future devices

---

## Health Engine

Responsible for:

- Data normalization
- Score calculation
- Trend analysis

---

## Health AI Core

Responsible for:

- Selecting AI Provider
- Generating today's advice
- Generating today's missions

---

## AI Providers

- Built-in AI (Free)
- ChatGPT
- Claude
- Gemini
- Ollama

The Built-in AI must always work without any paid account.

---

## UI

Displays:

- Health Score
- Missions
- AI Advice
- Trends

---

## Principle

Health Pilot should never show only data.

Health Pilot must always recommend today's next action.