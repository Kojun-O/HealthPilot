Sprint 22-1 — Context Understanding Layer MVP

Goal

Implement the first Context Understanding layer.

This layer converts free-text Daily Context into structured context signals.

Daily Context should no longer be interpreted directly inside Recommendation Engine over time.

This sprint creates the intermediate layer:

Daily Context
↓
Context Understanding
↓
Structured Context
↓
Recommendation Engine

Background

Current state:

- Daily Context input exists.
- Daily Context is stored locally.
- Recommendation Engine now reads Daily Context.
- Recommendation priority changes based on lightweight keyword detection.

That is acceptable for MVP, but the keyword/intent detection should be isolated into a dedicated Context Understanding layer.

This keeps Recommendation Engine focused on recommendations only.

------------------------------------------------

Scope

Create a new Context Understanding module.

It should receive Daily Context text and return structured context signals.

Use simple deterministic logic for now.

Do NOT use LLM.

Do NOT redesign UI.

Do NOT change Capacity Calculator.

Do NOT change Mission Builder.

------------------------------------------------

Out of Scope

Do NOT modify:

- Today's Capacity UI
- Explainability UI
- Mission card layout
- Check-in layout
- Header
- Hero
- Sleep / Health
- History
- Bottom Navigation
- Architecture documents

Do NOT implement:

- Learning Engine
- Apple Health
- Calendar integration
- LLM
- New pages
- Modal UI

------------------------------------------------

Input

Daily Context object, for example:

{
  note: "明日プレゼンがあります。今日は残業になりそうです。足首も少し痛いです。",
  date: "2026-07-06"
}

------------------------------------------------

Output

Return a structured context object.

Example:

{
  physical: {
    pain: true,
    painAreas: ["ankle"],
    fatigue: false
  },
  work: {
    workload: "high",
    importantEvent: true,
    eventType: "presentation",
    overtimeRisk: true
  },
  mental: {
    stressRisk: "medium",
    motivation: "unknown"
  },
  constraints: ["avoid_high_intensity_activity"],
  priorities: ["focus_protection", "recovery_support"]
}

Keep the output simple and extensible.

------------------------------------------------

Detection Rules

Use lightweight deterministic detection.

Support at least:

Physical:
- ankle pain
- headache
- fatigue
- cold symptoms

Work / Study:
- presentation
- deadline
- heavy workload
- overtime
- business trip

Mental:
- stressed
- anxious
- motivated
- calm

Family / Personal:
- family event
- child care
- travel

Japanese and English keywords are both acceptable.

Examples:

"足首が痛い"
→ physical.pain = true
→ painAreas includes "ankle"
→ constraints includes "avoid_high_intensity_activity"

"明日プレゼン"
→ work.importantEvent = true
→ eventType = "presentation"
→ priorities includes "focus_protection"

"残業になりそう"
→ work.overtimeRisk = true
→ work.workload = "high"
→ priorities includes "recovery_support"

------------------------------------------------

Recommendation Engine Integration

Update Recommendation Engine so it receives structured context signals instead of doing raw text interpretation itself.

Recommendation Engine may still accept raw Daily Context temporarily for backward compatibility, but new logic should prefer structured context.

Do NOT change Recommendation object shape.

Recommendation objects must remain:

{
  id,
  priority,
  objective,
  reason
}

------------------------------------------------

Implementation Rules

- New logic should be isolated in a new module.
- Keep existing behavior when Daily Context is empty.
- Preserve current Recommendation behavior for existing tests.
- Add tests for Context Understanding.
- Add or update Recommendation tests only if needed.
- Do not render structured context directly in UI.
- Do not change Mission Builder.

------------------------------------------------

Expected Modified Files

Expected:

- docs/js/contextUnderstanding.js
- tests/contextUnderstanding.test.js
- docs/js/recommendationEngine.js
- tests/recommendationEngine.test.js

Optional only if needed:

- docs/js/main.js

Prompt archive:

- prompts/Sprint22-1-Context-Understanding-Layer.md

No unrelated files.

------------------------------------------------

Definition of Done

✓ Context Understanding module implemented.

✓ Daily Context text can be converted into structured context.

✓ Recommendation Engine uses structured context signals.

✓ Recommendation object shape remains unchanged.

✓ Empty Daily Context preserves existing behavior.

✓ Mission Builder unchanged.

✓ UI unchanged.

✓ Tests pass.

------------------------------------------------

Review Checklist

Before stopping, verify:

□ Only expected files changed.

□ No UI redesign occurred.

□ No unrelated modules were modified.

□ Recommendation objects keep the same shape.

□ Mission Builder was not changed.

□ Capacity Calculator was not changed.

□ Empty Daily Context behavior is preserved.

□ Japanese Daily Context examples are covered.

□ Tests pass.

□ Prompt archived.

------------------------------------------------

Prompt Archive

Create or update:

prompts/Sprint22-1-Context-Understanding-Layer.md

Save this exact sprint prompt.

------------------------------------------------

After implementation

1. List modified files only.

2. Summarize changes.

3. Stop.
