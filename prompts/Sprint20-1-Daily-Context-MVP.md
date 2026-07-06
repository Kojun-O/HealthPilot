Sprint 20-1 Revision — Integrate Daily Context into Check-in

Goal

Implement Daily Context as an extension of the existing Today's Check-in card.

Daily Context should NOT be a separate card.

The Check-in card should become the place where the user provides human context that sensors cannot capture.

Background

Health Pilot should first show:

1. Today's Capacity
2. Mission
3. Today's Check-in

Daily Context is part of Check-in, not a separate section between Capacity and Mission.

The previous implementation inserted a Daily Context card between Capacity and Mission. That is not the desired information architecture.

Undo has already been applied.

------------------------------------------------

Scope

Extend the existing Today's Check-in card by adding a compact Daily Context input area at the bottom of the Check-in card.

Do NOT create a new Daily Context card.

Do NOT place Daily Context above Mission.

Do NOT move Capacity.

Do NOT move Mission.

------------------------------------------------

Out of Scope

Do NOT modify:

- Capacity Calculator
- Explainability
- Recommendation Engine
- Mission Builder
- Mission card
- Header
- Hero
- Sleep / Health
- History
- Bottom Navigation
- Architecture documents

Do NOT implement:

- AI reasoning from Daily Context
- Learning Engine
- Apple Health
- Calendar integration
- LLM
- New page navigation
- Modal UI

------------------------------------------------

UI Placement

Keep the existing Today order:

Header

Hero

Today's Capacity

Mission

Today's Check-in

Sleep / Health

History

Bottom Navigation

Inside the existing Today's Check-in card, add Daily Context at the bottom, after the current five check-in items.

------------------------------------------------

UI Requirements

At the bottom of Today's Check-in card, add a compact section:

Context

Anything important today?

Then provide:

1. Category chips

Physical

Mental

Work

Family

Other

2. Compact free note input

Use a small multiline textarea.

Placeholder:

足首が痛い、発表前、残業予定など

3. Save button

Label:

保存

------------------------------------------------

Design Requirements

The Daily Context area must feel like part of the Check-in card.

Use the existing card style.

Do not create a large standalone form.

Keep it compact.

The Check-in card should not become visually heavier than the Mission card.

Keep mobile layout clean.

No modal.

No popup.

No page navigation.

------------------------------------------------

Data

Store locally only.

Use localStorage.

Store an object like:

{
  category: "Work",
  note: "明日発表があります",
  date: "2026-07-06"
}

Restore the saved value on reload for the same day.

------------------------------------------------

Implementation Rules

Use the existing Check-in card structure.

Add the minimum HTML needed.

Add the minimum CSS needed.

Add the minimum JavaScript needed.

Keep existing Check-in interactions working.

Do not change star/check-in behavior.

Do not change Capacity expand/collapse behavior.

Do not change Mission generation.

------------------------------------------------

Expected Modified Files

Expected files:

- docs/index.html
- docs/style.css
- docs/js/main.js

Optional if useful:

- docs/js/dailyContext.js
- tests/dailyContext.test.js

Also create or update:

- prompts/Sprint20-1-Daily-Context-MVP.md

No unrelated files.

------------------------------------------------

Definition of Done

✓ No standalone Daily Context card exists.

✓ Daily Context appears inside Today's Check-in card.

✓ Category can be selected.

✓ Free note can be entered.

✓ Save button stores context locally.

✓ Saved context restores on reload for the same day.

✓ Existing Check-in layout still works.

✓ Existing Capacity card still works.

✓ Existing Mission card still works.

✓ Mobile layout remains clean.

------------------------------------------------

Review Checklist

Before stopping, verify:

□ Daily Context is inside Today's Check-in card.

□ Daily Context is NOT above Mission.

□ No standalone Daily Context card exists.

□ Existing Today order is preserved.

□ Check-in card still looks compact.

□ Capacity expand/collapse still works.

□ Mission card still renders generated missions.

□ Save and reload works.

□ Only expected files changed.

□ No unrelated modules modified.

□ No placeholder English text appears in the UI.

□ Tests pass if added.

------------------------------------------------

Prompt Archive

Create or update:

prompts/Sprint20-1-Daily-Context-MVP.md

Save this exact sprint prompt.

------------------------------------------------

After implementation

1. List modified files only.

2. Summarize changes.

3. Stop.