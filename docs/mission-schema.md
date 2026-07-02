# Mission Schema

Mission is the core object of Health Pilot.

Health Pilot does not primarily display data.

It creates one clear mission that helps the user make a better health decision today.

---

# Purpose

A mission must answer four questions:

1. What should I do?
2. Why should I do it?
3. When is it successful?
4. How confident is Health Pilot?

A mission is not a vague suggestion.

It is a structured, actionable decision.

---

# Core Structure

```yaml
mission:
  id: mission_2026_07_03_morning_walk
  title: Walk outside
  objective: Improve morning alertness
  action: Walk outside for 20 minutes
  timing: Before 10:00
  difficulty: easy
  priority: high
  confidence: 0.86
  status: pending

  reason:
    summary: Recovery indicators are slightly below baseline.
    signals:
      - HRV below baseline
      - Sleep debt increased
      - Morning inactivity detected

  success_criteria:
    type: duration
    target: 20 minutes
    deadline: 10:00

  user_decision:
    allowed_actions:
      - complete
      - skip
      - postpone
      - replace
```

---

# Required Fields

## id

Unique mission identifier.

Example:

```yaml
id: mission_2026_07_03_morning_walk
```

---

## title

Short mission name.

Rules:

- use plain language
- avoid technical terms
- keep it under 6 words when possible

Example:

```yaml
title: Walk outside
```

---

## objective

The intended health benefit.

Example:

```yaml
objective: Improve morning alertness
```

---

## action

The exact behavior the user should perform.

Example:

```yaml
action: Walk outside for 20 minutes
```

A mission without a clear action is invalid.

---

## timing

When the mission should be done.

Example:

```yaml
timing: Before 10:00
```

Timing should reduce ambiguity.

---

## difficulty

Estimated execution difficulty.

Allowed values:

```yaml
easy
moderate
hard
```

Health Pilot should prefer easier missions when expected benefit is similar.

---

## priority

Mission importance for today.

Allowed values:

```yaml
low
medium
high
critical
```

Use `critical` only when delay could meaningfully increase risk.

---

## confidence

Health Pilot's confidence in the recommendation.

Range:

```yaml
0.0 - 1.0
```

Rules:

- do not hide uncertainty
- avoid overconfident recommendations
- explain low confidence when relevant

---

## status

Current mission state.

Allowed values:

```yaml
pending
completed
skipped
postponed
replaced
expired
```

---

# Reason

The reason explains why the mission was selected.

Reason appears after the mission, not before it.

```yaml
reason:
  summary: Recovery indicators are slightly below baseline.
  signals:
    - HRV below baseline
    - Sleep debt increased
```

Rules:

- keep the summary short
- show only relevant signals
- avoid raw data unless requested
- translate signals into meaning

---

# Success Criteria

Every mission must define success.

```yaml
success_criteria:
  type: duration
  target: 20 minutes
  deadline: 10:00
```

Allowed types:

```yaml
duration
count
distance
time_window
boolean
```

Examples:

```yaml
success_criteria:
  type: boolean
  target: completed
```

```yaml
success_criteria:
  type: count
  target: 2 glasses of water
```

```yaml
success_criteria:
  type: time_window
  target: no caffeine
  deadline: after 15:00
```

---

# User Decision

Users must remain in control.

```yaml
user_decision:
  allowed_actions:
    - complete
    - skip
    - postpone
    - replace
```

Health Pilot recommends.

People decide.

---

# Optional Fields

## alternatives

Alternative missions when the user rejects the primary mission.

```yaml
alternatives:
  - title: Stretch for 5 minutes
    reason: Lower friction recovery option
```

---

## source_data

Data categories used to generate the mission.

```yaml
source_data:
  - sleep
  - HRV
  - activity
  - calendar
```

Do not expose sensitive details unless necessary.

---

## personalization

Context used to adapt the mission.

```yaml
personalization:
  habit_match: high
  previous_completion_rate: 0.72
  preferred_time: morning
```

---

## explanation_level

Controls how much explanation is shown.

```yaml
explanation_level: concise
```

Allowed values:

```yaml
minimal
concise
detailed
technical
```

Default should be `concise`.

---

# Invalid Missions

The following are invalid:

```yaml
title: Improve health
```

Reason:

- vague
- no action
- no success criteria

---

```yaml
title: Check your HRV
```

Reason:

- asks the user to interpret data
- does not produce behavior change

---

```yaml
title: Exercise more
```

Reason:

- vague
- no duration
- no timing
- unclear success

---

# Valid Mission Example

```yaml
mission:
  id: mission_2026_07_03_hydration
  title: Drink water
  objective: Support recovery
  action: Drink two glasses of water
  timing: Within the next hour
  difficulty: easy
  priority: medium
  confidence: 0.74
  status: pending

  reason:
    summary: Recovery looks slightly reduced and activity has been low.
    signals:
      - Lower recovery score
      - Low morning activity

  success_criteria:
    type: count
    target: 2 glasses
    deadline: within 1 hour

  user_decision:
    allowed_actions:
      - complete
      - skip
      - postpone
      - replace
```

---

# Schema Principle

A mission is valid only if it is:

- specific
- actionable
- time-bounded
- explainable
- user-controlled

If any of these are missing, it is not a Health Pilot mission.