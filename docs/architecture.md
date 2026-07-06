# Architecture v2

Health Pilot is an AI-first decision-support system.

Health Score remains an internal metric for model calibration and trend interpretation.

Today's Capacity is the primary user-facing concept.

---

## System Layers

Health Pilot

├── External Inputs

├── Health Signal Processing

├── Daily Context Intake

├── Context Understanding

├── AI Thought Engine

├── Capacity Estimation

├── Recommendation Engine

├── Mission Builder

├── Explanation Engine

├── Daily Reflection

├── Learning Engine

├── Personalized Model

└── Today UI

---

## Architecture Flow

External Inputs

↓

Health Signals

Daily Context

Calendar

Weather

History

↓

Daily Context Intake

↓

Context Understanding

↓

AI Thought Engine

↓

Today's Capacity

↓

Recommendations

↓

Mission Builder

↓

User's Day

↓

Daily Reflection

↓

Learning Engine

↓

Personalized Model

↓

Tomorrow's AI

---

## Core Philosophy

Understand first.

Think second.

Recommend third.

Explain only when asked.

---

## Daily Context Layer

Daily Context captures user-provided, non-sensor information about today's real constraints.

It is required because many high-impact decision factors cannot be inferred from wearable or passive health data.

### Required Categories

1. Physical
	- Headache
	- Ankle pain
	- Cold symptoms
	- Fatigue
	- Muscle soreness

2. Mental
	- Feeling stressed
	- Feeling motivated
	- Feeling anxious
	- Feeling calm

3. Work / Study
	- Important presentation
	- Heavy workload
	- Deadline today
	- Business trip

4. Personal / Family
	- Family event
	- Child care
	- Poor sleep because of baby
	- Social event

5. Free Notes
	- Users can write anything in natural language
	- Example: "My left ankle hurts."
	- Example: "I have an important customer presentation next week."
	- Example: "I'll probably work until 10 PM."
	- Example: "I feel much better today."

### Processing Rules

- The AI must never rely on predefined keywords only.
- Daily Context is treated as natural-language input, not as fixed tags.
- The AI Thought Engine extracts relevant signals from Daily Context before recommendation generation.
- Extracted signals are combined with health signals, calendar, weather, and history in a unified reasoning state.

---

## AI Thought Engine

The AI Thought Engine must transform raw health data and Daily Context into structured reasoning before any recommendation is generated.

### Internal Reasoning Stages (Sprint 17-3)

The engine completes the following stages in order:

#### 1. Situation Assessment

- Determine today's current state from health signals and Daily Context.
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

- Explicitly define today's objectives.
- Example objectives:
  - Protect focus.
  - Prioritize recovery.
  - Maintain momentum.
  - Avoid overload.
  - Prepare for tomorrow.

#### 5. Recommendation Generation

- Generate recommendation candidates that satisfy today's explicit objectives.

#### 6. Mission Builder Handoff

- Pass recommendation output to Mission Builder for conversion into one concrete mission.

### Structured Reasoning Output Contract

The AI Thought Engine must expose structured reasoning rather than only producing text.

Required fields:

- situationAssessment
- opportunities
- risks
- objectives
- reasoningSummary

`reasoningSummary` is reserved for downstream explanation and must be passed to the Explanation Engine.

---

## Daily Reflection

Daily Reflection captures real user feedback after the day is complete.

Required daily question:

"Was Today's Capacity close to how you actually felt?"

Allowed responses:

- Very accurate
- Mostly accurate
- Not accurate

Optional input:

- Free-text comment describing why capacity differed from lived experience

Examples:

- "Unexpected customer issue."
- "My headache got worse."
- "I felt much more energetic than expected."

---

## Learning Engine Layer

The Learning Engine is a separate architecture layer that improves tomorrow's predictions while preserving all historical observations.

### Learning Inputs

- Today's Capacity prediction
- Daily Reflection response
- Daily Context
- Completed Missions
- Health Signals
- Historical trends

### Personalization Targets

- Capacity estimation
- Recommendation weighting
- Mission selection
- Explanation quality

### Data Integrity Rule

- Never overwrite historical daily records.
- Keep past observations immutable.
- Produce versioned personalization states for future inference only.

### Required Learning Outputs

- predictionAccuracy
- confidence
- personalizedWeights
- learningInsights

---

## Personalized Model

Personalized Model is the persistent state produced by the Learning Engine and consumed by tomorrow's AI pipeline.

Responsibilities:

- Maintain versioned personalization parameters
- Expose read-only state for decision modules
- Allow confidence-based fallback to baseline behavior

Supporting components:

- Mission Schema constrains mission format during Mission Builder output.
- Explanation Engine generates rationale from decision outputs and learning context.

---

## Personalization Flow

1. Estimate Today's Capacity from current context.
2. Generate recommendation candidates and select one mission.
3. Observe user's day and mission completion behavior.
4. Collect Daily Reflection accuracy feedback.
5. Compare prediction vs lived experience in Learning Engine.
6. Update versioned Personalized Model for tomorrow.
7. Re-enter the main architecture flow with improved priors.

---

## Product Vision

Health Pilot helps people make better decisions by understanding today's capacity, not by maximizing health metrics.
