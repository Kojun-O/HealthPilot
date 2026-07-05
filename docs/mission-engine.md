# Mission Engine

## Purpose

The Mission Engine is the core decision system of Health Pilot.

Its purpose is to transform complex health data into one clear action.

The output is always:

> One Mission.

Never multiple priorities.

---

# Philosophy

Health data should not be shown directly.

Health data should become action.

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

Future versions may include additional health signals.

---

# Output

The engine produces exactly one Mission.

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

Health Data

↓

Mission Engine

↓

Mission Object

↓

UI Renderer

The Mission Engine must never manipulate the UI.

---

# AI Integration

Future AI providers may suggest Missions.

However,

The Mission Engine remains responsible for selecting the final Mission.

This keeps AI replaceable.

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