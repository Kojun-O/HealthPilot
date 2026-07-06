# Health Pilot Architecture v2

## Overview

Health Pilot transforms multi-source context into one clear daily decision.

```
External Inputs
      ━E
      ▼
Health Signals + Daily Context + Calendar + Weather + History
      ━E
      ▼
Daily Context Intake
      ━E
      ▼
Context Understanding
      ━E
      ▼
AI Thought Engine
      ━E
      ▼
Today's Capacity
      ━E
      ▼
Recommendations
      ━E
      ▼
Mission Builder
      ━E
      ▼
User's Day
      ━E
      ▼
Daily Reflection
      ━E
      ▼
Learning Engine
      ━E
      ▼
Personalized Model
      ━E
      ▼
Tomorrow's AI
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

### Daily Context (Non-Sensor Layer)

Daily Context represents real-world factors that cannot be captured automatically from health sensors.

Required categories:

- Physical (headache, ankle pain, cold symptoms, fatigue, muscle soreness)
- Mental (stressed, motivated, anxious, calm)
- Work / Study (important presentation, heavy workload, deadline today, business trip)
- Personal / Family (family event, child care, poor sleep because of baby, social event)
- Free Notes (open natural-language input)

Free Notes examples:

- "My left ankle hurts."
- "I have an important customer presentation next week."
- "I'll probably work until 10 PM."
- "I feel much better today."

Design constraints:

- Never depend on predefined keywords only.
- Treat all Daily Context as natural-language input.
- Preserve user intent and uncertainty in downstream reasoning.

---

## AI Thought Engine

Responsible for:

- Transforming today's context state into structured reasoning before recommendation generation
- Exposing explicit reasoning artifacts for downstream engines
- Ensuring recommendation quality is grounded in situation, opportunity, risk, and objective logic

AI interaction with Daily Context:

- Parse Daily Context text semantically, not by keyword lookup only.
- Extract relevant signals such as constraints, obligations, symptoms, stressors, and time pressure.
- Convert extracted signals into a structured reasoning state with confidence and recency awareness.
- Pass extracted context signals into Recommendation Engine before ranking.

### Internal Reasoning Stages (Sprint 17-3)

The AI Thought Engine must complete the following stages in order.

#### 1. Situation Assessment

- Determine the current state from health signals and Daily Context.
- Example statements:
  - Recovery is sufficient.
  - Cognitive load is high.
  - Physical fatigue is low.
  - Stress is increasing.
  - Sleep debt is accumulating.

#### 2. Opportunity Detection

- Identify realistic windows where beneficial actions are feasible today.
- Example opportunities:
  - Morning focus window is available.
  - Recovery opportunity after lunch.
  - Walking opportunity before dinner.

#### 3. Risk Detection

- Identify risks that should constrain recommendation strategy.
- Example risks:
  - Overwork risk.
  - Sleep deficit risk.
  - Burnout trend.
  - Injury aggravation risk.

#### 4. Decision Objectives

- Explicitly define today's objectives before recommendation generation.
- Example objectives:
  - Protect focus.
  - Prioritize recovery.
  - Maintain momentum.
  - Avoid overload.
  - Prepare for tomorrow.

#### 5. Recommendation Generation

- Generate recommendation candidates that satisfy today's explicit objectives.

#### 6. Mission Builder Handoff

- Provide recommendation output to Mission Builder for conversion into one concrete mission.

### Structured Reasoning Output Contract

The AI Thought Engine must expose structured reasoning, not only text.

Required fields:

- situationAssessment
- opportunities
- risks
- objectives
- reasoningSummary

`reasoningSummary` is reserved for downstream explanation and must be passed to the Explanation Engine.

---

## Recommendation Engine

Responsible for:

- Ranking candidate actions by expected daily value
- Selecting the most valuable recommendation for today
- Preserving user autonomy in final decision making

Personalization hook:

- Apply user-specific recommendation weighting from the Personalized Model
- Keep a baseline strategy available when confidence is low

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

Personalization hook:

- Adapt explanation style and emphasis using learned user preferences and outcomes

---

## Daily Reflection

Responsible for collecting end-of-day user feedback after the mission period.

Required daily question:

"Was Today's Capacity close to how you actually felt?"

Allowed responses:

- Very accurate
- Mostly accurate
- Not accurate

Optional input:

- Free-text comment explaining why accuracy differed

Examples:

- "Unexpected customer issue."
- "My headache got worse."
- "I felt much more energetic than expected."

---

## Learning Engine

The Learning Engine is a separate architecture layer that continuously improves future predictions without rewriting the past.

It compares:

- Today's Capacity prediction
- End-of-day reflection
- Daily Context
- Completed Missions
- Health Signals
- Historical trends

It gradually personalizes:

- Capacity estimation
- Recommendation weighting
- Mission selection
- Explanation quality

It identifies which signals are most predictive for this individual user over time.

### Non-Destructive Learning Rule

- Historical observations are append-only and immutable.
- Learning updates generate new model states for future decisions.
- Recomputed insights must be versioned, never backfilled by overwriting original daily records.

### Output Contract

The Learning Engine provides structured outputs for next-day decision layers.

Required fields:

- predictionAccuracy
- confidence
- personalizedWeights
- learningInsights

---

## Personalized Model

Responsible for carrying forward the latest learned parameters into tomorrow's decision cycle.

Responsibilities:

- Store versioned personalization state
- Provide stable read access for Context Understanding, AI Thought Engine, and Recommendation Engine
- Support safe fallback to baseline behavior when personalization confidence is low

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

Learn continuously.

Explain only when asked.

---

## Product Vision

Health Pilot helps people make better decisions by understanding today's capacity, not by maximizing health metrics.