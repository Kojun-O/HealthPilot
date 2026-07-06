# Learning Engine Architecture

## Goal

Continuously personalize Health Pilot so tomorrow's predictions and recommendations are more accurate than today's.

The Learning Engine improves future inference while preserving all historical observations.

---

## Position in System

External Inputs

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

## Daily Reflection Input

Required daily question:

"Was Today's Capacity close to how you actually felt?"

Allowed responses:

- Very accurate
- Mostly accurate
- Not accurate

Optional:

- Free-text comment for context and exceptions

Examples:

- "Unexpected customer issue."
- "My headache got worse."
- "I felt much more energetic than expected."

---

## Learning Inputs

The Learning Engine compares:

- Today's Capacity prediction
- End-of-day feedback
- Daily Context
- Completed Missions
- Health Signals
- Historical trends

---

## Personalization Scope

Learning Engine gradually personalizes:

- Capacity estimation
- Recommendation weighting
- Mission selection
- Explanation quality

The engine should infer which signals best predict this specific user's daily condition.

---

## Data Integrity Requirements

1. Never overwrite historical data.
2. Keep all daily observations append-only.
3. Generate new model state versions for future predictions.
4. Keep raw history and learned parameters separate.

---

## Output Contract

Required outputs:

- predictionAccuracy
- confidence
- personalizedWeights
- learningInsights

Output intent:

- `predictionAccuracy`: calibration signal from prediction vs lived experience.
- `confidence`: reliability of the current personalized model state.
- `personalizedWeights`: user-specific signal and recommendation weight adjustments.
- `learningInsights`: compact explanation of what changed and why.

---

## Separation of Concerns

- Learning Engine is architecture-only decision support logic.
- It must not render UI and must not change presentation behavior directly.
- UI consumes already-produced outputs from upstream decision layers.

---

## Success Criteria

The Learning Engine is successful when:

- Capacity prediction accuracy improves over time.
- Mission relevance improves for this user.
- Recommendation confidence calibration becomes more reliable.
- Users can understand why personalization changed.
