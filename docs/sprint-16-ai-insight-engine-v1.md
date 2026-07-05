# Sprint 16 - AI Insight Engine v1

## Goal

Define the first implementation architecture for an AI Insight Engine that transforms daily health signals into:

- prioritized mission candidates
- clear AI explanations
- future health recommendations

Constraints:

- No Apple Health integration in this sprint
- No UI changes
- No Today screen changes

---

## 1. Input Health Signals

### Objective

Create one normalized input contract so all decision modules work with consistent data.

### Input Sources (v1)

- Daily check-in values (sleep, stress, energy, mood)
- Existing computed scores from local engines
- Recent mission completion history
- Time context (time of day, day of week)

### Data Contract

```js
// InsightInput v1
{
  date: "2026-07-05",
  profileId: "local-user",
  signals: {
    sleepScore: 0-100,
    recoveryScore: 0-100,
    stressLevel: 0-100,
    activityScore: 0-100,
    moodScore: 0-100,
    focusLevel: 0-100,
    hydrationScore: 0-100 | null
  },
  context: {
    timeOfDay: "morning" | "afternoon" | "evening",
    weekday: 0-6,
    recentCompletionRate: 0-100,
    streakDays: number
  }
}
```

### Module

- InputNormalizer
  - Validates ranges
  - Applies fallbacks for missing values
  - Produces deterministic normalized input

---

## 2. Rule Engine

### Objective

Convert normalized signals into actionable rule outcomes.

### Design

- Deterministic rule set (JSON-like definitions)
- Each rule returns:
  - triggered (boolean)
  - category
  - impact score
  - urgency score
  - confidence
  - explanation fragments

### Rule Groups (v1)

- Recovery rules
- Sleep rules
- Stress regulation rules
- Activity activation rules
- Focus and cognitive load rules

### Example Rule Shape

```js
{
  id: "recovery_low_high_stress",
  when: (s) => s.recoveryScore < 45 && s.stressLevel > 70,
  missionCategory: "recovery",
  impact: 0.9,
  urgency: 0.85,
  feasibility: 0.7,
  confidence: 0.8,
  reasonFragments: [
    "Recovery is low",
    "Stress is elevated"
  ]
}
```

### Module

- RuleEngine
  - evaluate(input) -> RuleOutcome[]

---

## 3. Mission Selection Engine

### Objective

Transform rule outcomes into prioritized mission candidates and choose the one primary mission for today.

### Flow

1. Generate mission candidates from triggered rules
2. Merge duplicates by category and action intent
3. Score each candidate
4. Rank by final priority
5. Select one primary mission for Today screen compatibility
6. Keep remaining ranked candidates for explanation and future recommendation planning

### Output

```js
{
  primaryMission: Mission,
  rankedCandidates: Mission[],
  droppedCandidates: Mission[],
  selectionMeta: {
    topScore: number,
    tieBreakReason: string,
    generatedAt: string
  }
}
```

### Tie-Break Policy

- Safety and recovery first
- Higher feasibility over theoretical impact when scores are close
- Prefer actions user can complete within same day

### Module

- MissionSelectionEngine
  - select(ruleOutcomes, input) -> MissionSelectionResult

---

## 4. Priority Scoring

### Objective

Make prioritization explicit, inspectable, and easy to tune.

### Score Components

- Impact: expected health benefit today
- Urgency: risk of not acting today
- Feasibility: probability of completion
- Confidence: rule confidence from input quality
- AdherenceBoost: slight bonus for sustainable behavior patterns

### Formula (v1)

$$
priority = 0.35 \cdot impact + 0.30 \cdot urgency + 0.20 \cdot feasibility + 0.10 \cdot confidence + 0.05 \cdot adherenceBoost
$$

### Notes

- All inputs normalized to $0..1$
- Weight constants stored in one config object
- Deterministic scoring by default

### Module

- PriorityScorer
  - score(candidate, input) -> number

---

## 5. Explanation Generator

### Objective

Generate human-readable, action-first explanation text from deterministic signals and selection data.

### Output Types

- Mission reason (short, Today-compatible)
- AI explanation (1-3 short sentences)
- Why-this-not-that summary (optional, for future detail view)

### Generation Pattern

1. Start with action recommendation
2. Mention top 1-2 signal drivers
3. Add confidence and tone guardrails
4. Keep wording calm, non-medical, and autonomy-preserving

### Example

```txt
Mission: Take a 15-minute recovery walk before noon.
Why: Your recovery trend is lower than usual and stress is elevated today.
This action has a high chance of improving energy without adding strain.
```

### Module

- ExplanationGenerator
  - build(primaryMission, rankedCandidates, input, selectionMeta) -> ExplanationBundle

---

## 6. Future Extensibility

### Extension Principles

- Keep decision logic independent from rendering
- Keep providers replaceable
- Keep rule layer deterministic even if AI layer changes

### Planned Extension Points

- SignalProvider interface
  - Add external sources later without changing engines
- RulePack registry
  - Add or remove domain rules safely
- Recommendation horizon
  - Expand from today mission to weekly future recommendations
- AI provider adapter
  - Optional LLM rewriting of explanations, never final mission selection authority
- Experiment flags
  - A/B test scoring weights and rule packs

### Interface Sketch

```js
interface SignalProvider {
  getDailySignals(date, profileId): Promise<InsightInput>
}

interface RulePack {
  id: string
  version: string
  evaluate(input): RuleOutcome[]
}

interface ExplanationProvider {
  generate(bundle): ExplanationBundle
}
```

---

## Proposed v1 Module Map

```txt
InputNormalizer
  -> RuleEngine
    -> MissionSelectionEngine
      -> PriorityScorer
      -> ExplanationGenerator

Outputs:
- primaryMission (today)
- rankedCandidates (internal + future)
- explanationBundle
```

---

## Implementation Boundaries for Sprint 16

In scope:

- Architecture definition and contracts
- Deterministic rule and scoring design
- Primary mission plus ranked candidate structure
- Explanation generation contract

Out of scope:

- Apple Health integration
- UI component changes
- Today screen rendering changes
- Notification and forecasting UI

---

## Recommended File Structure (for implementation phase)

```txt
docs/js/insight/
  inputNormalizer.js
  ruleEngine.js
  missionSelectionEngine.js
  priorityScorer.js
  explanationGenerator.js
  insightEngine.js
```

This structure keeps business logic modular, testable, and replaceable while preserving Health Pilot's Mission-first product direction.
