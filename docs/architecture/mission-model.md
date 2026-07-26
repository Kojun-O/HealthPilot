# Mission Model

## Purpose

Health Pilot does not simply display health data.

Its purpose is to convert health data into clear, actionable daily choices.

The mission pipeline is:

```text
Health Data
    ↓
Normalization
    ↓
Insight Generation
    ↓
Mission Candidate Generation
    ↓
Mission Selection
    ↓
Today's Missions
    ↓
Completion & Outcome Evaluation
```

Each stage has a single responsibility.

- **Insights** explain what is happening.
- **Mission Candidates** propose possible actions.
- **Mission Selection** decides which actions should be shown today.

This separation keeps the system explainable, testable, and easy to evolve.

---

# Mission Candidate v1.0

The current implementation intentionally combines two conceptual models into one object.

This keeps the architecture simple while the Mission library is still small.

```ts
type MissionCandidate = {
  id: string;
  sourceInsightIds: string[];
  type: string;
  title: string;
  rationale: string;
  evidenceSummary: string;
  estimatedDurationMinutes?: number;
};
```

## Fields

### id

A stable, action-based identifier.

The ID describes **the action**, not the Insight that generated it.

Mission titles may change without changing the ID.

Example:

```text
rest_eyes_closed_15min
walk_outdoors_15min
```

---

### sourceInsightIds

The Insight IDs that caused this Mission Candidate to be generated.

One Mission Candidate may originate from multiple Insights.

---

### type

The current action category.

Examples:

```text
rest
activity
```

The name `type` is acceptable for v1.0.

Renaming it to `category` may be considered later.

---

### title

The user-facing description of the Mission.

Example:

> Rest your eyes for 15 minutes.

Titles are free to change.

The Mission ID must remain stable.

---

### rationale

Explains why this Mission is relevant **today**.

It is generated from the user's current health state.

Example:

> Your main sleep duration was shorter than the target.

---

### evidenceSummary

Explains why this action may generally help.

Unlike `rationale`, this is reusable knowledge.

Example:

> A short period of eyes-closed rest may reduce subjective fatigue and sleepiness.

---

### estimatedDurationMinutes

Approximate execution time.

Rules:

- optional
- positive integer
- omit when unknown
- never use `null`

Example:

```text
15
```

---

# Rationale vs Evidence Summary

These two concepts must remain separate.

## rationale

Why this Mission is relevant **today**.

Example:

```text
Your main sleep duration was shorter than the target.
```

## evidenceSummary

Why the action itself may help.

Example:

```text
A short period of eyes-closed rest may reduce subjective fatigue.
```

In short:

```text
rationale
=
Why today?

evidenceSummary
=
Why this action?
```

---

# Future Architecture

The current model intentionally combines two concepts.

In the future they may be separated.

## Mission Definition

Reusable knowledge.

```ts
type MissionDefinition = {
  id: string;
  type: string;
  title: string;
  evidenceSummary: string;
  estimatedDurationMinutes?: number;
};
```

Mission Definitions do **not** depend on today's health data.

They are reusable across users and across days.

---

## Mission Candidate

Today's proposal.

```ts
type MissionCandidate = {
  missionId: string;
  sourceInsightIds: string[];
  rationale: string;
};
```

Mission Candidates connect today's Insights with reusable Mission Definitions.

---

Future pipeline:

```text
Insights
        +
Mission Definitions
        ↓
Mission Candidate Generation
        ↓
Mission Candidates
```

Mission Definitions are **not generated from Insights**.

---

# Why Separation Is Deferred

The Mission library is currently very small.

Separating Mission Definition and Mission Candidate now would introduce:

- repositories
- loaders
- storage abstractions
- additional complexity

without enough benefit.

Following **YAGNI**, the combined model is intentionally kept until the Mission library grows.

The current model should remain easy to separate later.

---

# Mission Selection Boundary

Mission Candidates do **not** decide whether they are shown.

Mission Selection is responsible for:

- priority
- deduplication
- user preferences
- Mission history
- repetition avoidance
- time constraints
- safety constraints

Mission Candidate should remain a passive data model.

---

# Mission Assignment

Showing a Mission to the user is a separate concept.

Eventually, a Mission Assignment model will be introduced.

```ts
type MissionAssignment = {
  assignmentId: string;
  missionId: string;
  selectedAt: string;
  status: "pending" | "completed" | "skipped";
  completedAt?: string;
};
```

The same Mission may be assigned many times.

Example:

```text
Mission
rest_eyes_closed_15min

↓

Monday assignment

↓

Friday assignment
```

The Mission is the same.

The Assignments are different.

---

# Mission ID Rules

Mission IDs follow these rules.

- lowercase
- snake_case
- describe the action
- never describe the Insight
- include duration only when it is intrinsic to the action

Good:

```text
rest_eyes_closed_15min
walk_outdoors_15min
```

Avoid:

```text
short_main_sleep_rest
low_activity_walk
```

---

# Non-Goals for v1.0

Mission Candidate v1.0 intentionally does **not** include:

- Mission repository
- JSON storage
- database storage
- LLM-generated Missions
- Mission ranking
- personalization
- preferred time
- preferred location
- difficulty
- calories
- UI behavior

These may be introduced later if they provide clear value.

---

# Architecture Principle

Health Pilot's value is **not** displaying health data.

Its value is converting health data into clear, actionable choices while preserving the user's final decision.