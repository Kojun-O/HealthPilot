Sprint 21-1 — Connect Daily Context to Recommendation Engine

Goal

Connect Daily Context to the Recommendation Engine.

Health Pilot should begin using the user's free-text Daily Context as an input when generating recommendations.

No visible UI redesign is required in this sprint.

Background

Current pipeline:

Health Signals
↓
Capacity Calculator
↓
Explainability
↓
Recommendation Engine
↓
Mission Builder

Daily Context already exists and is stored locally.

It is currently NOT used by the AI pipeline.

This sprint connects it.

------------------------------------------------

Scope

Update the Recommendation Engine so that it receives:

1. Capacity result

2. Daily Context (free-text)

Recommendation priority should be influenced by Daily Context.

------------------------------------------------

Out of Scope

Do NOT modify:

- Today's Capacity UI
- Capacity Calculator formula
- Explainability UI
- Mission card design
- Header
- Hero
- Sleep / Health
- History
- Bottom Navigation
- Architecture documents

Do NOT redesign Daily Context.

Do NOT add new UI.

Do NOT implement LLM.

------------------------------------------------

Behavior

Examples:

Daily Context:

"My ankle hurts today."

↓

Recommendation priority should favor recovery-related recommendations.

------------------------------------------------

Daily Context:

"Big presentation tomorrow."

↓

Recommendation priority should favor focus, sleep and stress reduction.

------------------------------------------------

Daily Context:

"Working late tonight."

↓

Recommendation should reduce workload and encourage recovery.

------------------------------------------------

Daily Context:

(empty)

↓

Behavior should remain exactly as today.

------------------------------------------------

Implementation Rules

Use lightweight keyword/intent detection only.

Do NOT hardcode recommendation text inside UI.

Recommendation Engine should output structured recommendation objects exactly as before.

Only the recommendation priorities should change.

Mission Builder should continue consuming recommendation output without modification.

------------------------------------------------

Expected Modified Files

Expected:

- docs/js/recommendationEngine.js

Optional:

- docs/js/main.js
- tests/recommendationEngine.test.js

No UI files unless absolutely necessary.

------------------------------------------------

Definition of Done

✓ Existing UI unchanged.

✓ Recommendation Engine reads Daily Context.

✓ Recommendation priority changes when Daily Context is present.

✓ Empty Daily Context preserves current behavior.

✓ Mission Builder works without modification.

✓ Existing tests pass.

------------------------------------------------

Review Checklist

Before stopping, verify:

□ Only expected files changed.

□ No UI redesign occurred.

□ Capacity behavior unchanged.

□ Explainability unchanged.

□ Mission Builder unchanged.

□ Recommendation output remains structured.

□ Daily Context influences recommendation priority.

□ Tests pass.

------------------------------------------------

Prompt Archive

Create or update:

prompts/Sprint21-1-Connect-Daily-Context.md

Save this exact sprint prompt.

------------------------------------------------

After implementation

1. List modified files only.

2. Summarize changes.

3. Stop.
