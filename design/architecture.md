# Health Pilot Architecture v2

## Overview

Health Pilot transforms multi-source context into one clear daily decision.

```
External Inputs
      │
      ▼
Health Signals + Daily Context + Calendar + Weather + History
      │
      ▼
Context Understanding
      │
      ▼
AI Thought Engine
      │
      ▼
Recommendation Engine
      │
      ▼
Mission Builder
      │
      ▼
Mission Schema
      │
      ▼
Explanation Engine
      │
      ▼
Today's Capacity
      │
      ▼
Today UI
```

---

## Data Sources

- Apple Health
- SOXAI Ring
- Manual Input
- Calendar
- Weather
- Future devices

---

## Health Engine

Responsible for:

- Data normalization
- Internal score calculation
- Trend analysis
- Signal quality checks

---

## Context Understanding

Responsible for:

- Building a representation of today's situation
- Combining signals, context, schedule, weather, and history
- Producing an interpretable context state for downstream reasoning

---

## AI Thought Engine

Responsible for:

- Reasoning over today's context state
- Estimating today's usable resources
- Generating candidate actions before recommendation ranking

---

## Recommendation Engine

Responsible for:

- Ranking candidate actions by expected daily value
- Selecting the most valuable recommendation for today
- Preserving user autonomy in final decision making

---

## Mission Builder

Responsible for:

- Translating recommendations into mission-ready structure
- Applying Mission Schema constraints
- Returning exactly one clear daily mission

---

## Explanation Engine

Responsible for:

- Generating concise rationale for the mission
- Expanding details only when requested
- Keeping explanation separate from decision generation

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

- Today's Capacity
- Missions
- AI rationale on demand

Health Score is internal and should not be the primary user-facing concept.

---

## Principle

Health Pilot should never show only data.

Health Pilot must always recommend today's next action.

Understand first.

Think second.

Recommend third.

Explain only when asked.

---

## Product Vision

Health Pilot helps people make better decisions by understanding today's capacity, not by maximizing health metrics.