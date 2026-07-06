# Mission Engine

## Purpose

The Mission Engine is the core decision system of Health Pilot.

Its purpose is to transform complex health data into one clear action.

It operates after context understanding and AI reasoning stages.

The output is always:

> One Mission.

Never multiple priorities.

---

# Philosophy

Health data should not be shown directly.

Health data should become action.

Understand first.

Think second.

Recommend third.

Explain only when asked.

Mission

↓

Reason

↓

Data

---

# Inputs

The Mission Engine may use:

- Sleep
- HRV
- Resting Heart Rate
- Activity
- Steps
- Exercise
- Recovery
- Stress
- Time of day
- Day of week
- User habits
- Historical trends
- Daily Context (physical, mental, work/study, personal/family, free notes)
- Calendar context
- Weather context

Future versions may include additional health signals.

---

# Output

The engine produces exactly one Mission.

The surrounding AI system also outputs Today's Capacity as the primary user-facing state.

Health Score remains an internal metric only.

Example:

Title

Walk outside for 20 minutes before 10:00.

Reason

Morning sunlight improves alertness.

Priority

High

Category

Activity

---

# Selection Rules

The engine should identify the action with the greatest expected benefit today.

Selection order:

1. Safety
2. Recovery
3. Sleep
4. Exercise
5. Nutrition
6. Habit
7. Optimization

Only one Mission should be returned.

---

# Mission Properties

Each Mission contains:

- id
- title
- deadline
- reason
- category
- estimatedImpact

No UI-specific information should be included.

---

# Architecture

External Inputs

↓

Health Signals + Daily Context + Calendar + Weather + History

↓

Daily Context Intake (Natural Language)

↓

Context Understanding

↓

AI Thought Engine

↓

Structured Reasoning Package

↓

Recommendation Engine

↓

Mission Builder (Mission Engine)

↓

Mission Schema

↓

Explanation Engine

↓

Today's Capacity

↓

Today UI

The Mission Engine must never manipulate the UI.

---

# AI Thought Engine Contract

Before recommendation ranking, the AI Thought Engine must complete explicit reasoning and expose it as structured output.

Required staged reasoning order:

1. Situation Assessment
2. Opportunity Detection
3. Risk Detection
4. Decision Objectives
5. Recommendation Generation
6. Mission Builder Handoff

Required structured reasoning fields:

- situationAssessment
- opportunities
- risks
- objectives
- reasoningSummary

The Recommendation Engine and Mission Engine consume this structured reasoning package.

`reasoningSummary` is reserved for downstream use by the Explanation Engine.

---

# AI Integration

Future AI providers may suggest Missions.

However,

The Mission Engine remains responsible for forming the final Mission from the selected recommendation.

This keeps AI replaceable.

Daily Context AI interaction rules:

- Daily Context must be interpreted as natural-language input.
- AI must never rely on predefined keywords only.
- AI Thought Engine extracts relevant signals from Daily Context before recommendation generation.
- Extracted signals must be merged with health signals and other context before ranking recommendations.

---

# Non Goals

The Mission Engine is not responsible for:

- rendering
- charts
- notifications
- widgets
- layout

Only decision making.

---

# Success Criteria

A successful Mission Engine:

- outputs one Mission only
- reduces cognitive load
- explains the recommendation
- supports user autonomy
- remains deterministic when required