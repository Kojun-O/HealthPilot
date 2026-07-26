# Mission Architecture

## Purpose

Health Pilot converts health data into clear daily actions.

The Mission architecture keeps this flow explicit:

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
Today's Mission(s)
```

Mission Definition, Mission Candidate, and Mission Selection each have a distinct responsibility so the system stays explainable, testable, and maintainable.

---

## Mission Definition

### Purpose

Mission Definition standardizes the actions managed by Health Pilot.

It represents reusable action knowledge across users, insights, and dates. It is not a recommendation for a specific user or a specific day.

### Responsibility

Mission Definition is responsible for:

- Defining the action itself.
- Holding shared attributes of the action.
- Remaining reusable across users, dates, and recommendation contexts.

Mission Definition is NOT responsible for:

- Determining suitability for a specific user.
- Determining whether the action should be recommended today.
- Determining Mission priority.
- Holding execution state.
- Guaranteeing health improvement.

### Data Model

```ts
type MissionDefinition = {
  id: string;
  title: string;
  type: string;
  evidenceSummary: string;
  estimatedDurationMinutes?: number;
};
```

### Design Principles

1. Define one action only.
2. Be reusable.
3. Be independent of Insights and recommendation context.
4. Be evidence-informed.
5. Represent a behavior, not diagnosis or treatment.
6. Be understandable without specialist knowledge.
7. Avoid assumptions about specific users.

### Deferred Extensions

Do not add these until concrete product requirements exist:

- eligibility requirements
- contraindications
- intensity / difficulty
- supporting references
- parameterized actions
- Mission Definition versioning

---

## Mission Candidate

### Purpose

Mission Candidate is a temporary recommendation candidate that adds contextual rationale for a Mission Definition.

Mission Candidate is input to Mission Selection.

Mission Candidate is not limited to one source type. It may be generated from available information such as Insights, check-ins, mission history, and user preferences.

### Responsibility

Mission Candidate is responsible for:

- Referencing exactly one Mission Definition.
- Holding why the Mission is relevant in the current context.
- Identifying the information sources that support the recommendation.
- Providing evaluation input for Mission Selection.

Mission Candidate is NOT responsible for:

- Defining a new Mission.
- Modifying Mission Definition.
- Holding final ranking or selection results.
- Deciding which Mission to present today.
- Holding completion state.
- Finalizing UI copy.

### Data Model

Use this v1 model:

```ts
type MissionCandidate = {
  definitionId: string;
  rationale: string;
  sourceInsightIds: string[];
};
```

If non-Insight source tracking becomes a real product need, `sourceInsightIds` may evolve to `sourceRefs`. Do not generalize prematurely.

### Design Principles

1. Reference exactly one Mission Definition.
2. Represent why the Mission is relevant in the current context.
3. Do not redefine or modify the referenced Mission.
4. Keep recommendation rationale distinct from selection reason.
5. Identify the information supporting the recommendation.
6. Remain independent of Mission Selection.
7. Be disposable after Mission Selection unless retained for audit purposes.
8. Do not depend on one specific input source.

### Architecture Rules

- Insight interprets state and does not decide concrete actions.
- Every Mission Candidate SHALL reference exactly one Mission Definition.
- Mission Candidate holds recommendation rationale and does not hold final evaluation results such as `priority`, `rank`, `finalScore`, or `selected`.

---

## Mission Selection

### Purpose

Mission Selection evaluates Mission Candidates and determines the set of Missions to present to the user for the day.

Based on Health Pilot recommendation policy, it handles suitability checks, exclusion, prioritization, overlap adjustment, and mission count decisions.

Mission Selection is a decision process, not a data model.

### Internal Flow

Keep these steps conceptually separable:

```text
Eligibility filtering
  ↓
Ranking
  ↓
Conflict / redundancy resolution
  ↓
Mission set composition
```

In v1, implementation may be a single process or service.

### Responsibility

Mission Selection is responsible for:

- Evaluating Mission Candidates.
- Evaluating suitability for the user and current context using available information.
- Excluding candidates that are unsuitable, infeasible, conflicting, or clearly risky.
- Determining priority among candidates.
- Resolving redundancy and conflicts across missions.
- Deciding mission count and composition.
- Returning no selection when no suitable candidate exists.

Mission Selection is NOT responsible for:

- Defining Missions.
- Modifying Mission Definition.
- Generating Mission Candidates.
- Generating candidate recommendation rationale.
- Generating health data or Insights.
- Evaluating execution outcomes.
- Constructing UI wording.
- Guaranteeing medical safety or health improvement.

### Selection Criteria

Mission Selection may consider:

- Relevance to current context.
- Eligibility based on available information.
- Feasibility today.
- Estimated duration.
- Redundancy and conflicts between missions.
- Past mission presentation and execution history.
- User preferences and constraints.
- Presence and freshness of supporting data.

In v1, minimal implementation may focus on relevance, redundancy avoidance, and mission count.

### Design Principles

1. Select missions relevant to the user and the current situation.
2. Exclude missions that are clearly unsuitable based on available information.
3. Prefer actions that are feasible today.
4. Avoid redundant or conflicting missions.
5. Limit the number of missions to reduce cognitive load.
6. Preserve transparency about why each Mission was relevant and selected.
7. Allow fewer or no Missions when suitable candidates do not exist.
8. Avoid medical diagnosis or treatment decisions.
9. Be explainable and reproducible where practical.

### Architecture Rules

- Mission Selection does not modify Mission Definition.
- If a 15-minute Mission is changed to 5 minutes, treat it as a different Definition or future parameterization, not a display-only adjustment.
- Distinguish candidate rationale from selection reason.
- Candidate rationale means why a Mission became a candidate.
- Selection reason means why a candidate was selected among alternatives.
- In v1 persisted data, selection reason is optional and may be handled as logs or debug metadata.
- If suitable candidates do not exist, do not force a fixed mission count.
- Deterministic behavior is not an absolute requirement; follow explainable and reproducible where practical.

---

## Mission Architecture Status

Mission Definition, Mission Candidate, and Mission Selection are Accepted as Mission Architecture v1.0.

Accepted means the architecture is ready to use as the baseline for follow-up design and v1 implementation. It does not mean forbidden to change.

Change only when one of the following is true:

- actual product requirement cannot be represented
- implementation reveals a recurring responsibility conflict
- safety or privacy requirements require a new boundary
- multiple components repeatedly duplicate the same logic

Do not change only because a possible future need is imagined.

---

## Architecture Principle

Health Pilot is not a dashboard.

Its value is to reduce cognitive load by recommending clear daily actions while preserving user autonomy.