# Architecture Review Checklist

Use this checklist when reviewing architecture and model boundaries.

## Mission Definition

- Defines exactly one action.
- Can be reused across users and days.
- Is independent of Insights and recommendation context.
- Uses evidence-informed wording.
- Represents behavior rather than diagnosis or treatment.
- Is understandable without specialist knowledge.
- Does not assume specific user attributes unless explicitly defined.
- Contains only shared attributes of the behavior.
- Does not contain selection rank, completion state, or target date.

## Mission Candidate

- References exactly one Mission Definition.
- Represents why the Mission is relevant in the current context.
- Does not redefine or modify the Mission.
- Keeps recommendation rationale distinct from selection reason.
- Identifies the information supporting the recommendation.
- Does not contain final rank, selected status, or completion state.
- Can be discarded after Mission Selection unless retained for audit purposes.
- Is not limited to a specific input source.

## Mission Selection

- Evaluates Mission Candidates rather than defining Missions.
- Uses only available information when evaluating suitability.
- Excludes clearly unsuitable, infeasible, redundant, or conflicting candidates.
- Does not modify Mission Definition.
- Limits the number of Missions to reduce cognitive load.
- Can return fewer Missions, or no Mission, when appropriate.
- Keeps selection reason distinct from candidate rationale.
- Is explainable and reproducible where practical.
- Does not perform medical diagnosis or treatment decisions.
- Does not guarantee medical safety or condition improvement.
- Keeps eligibility, ranking, conflict resolution, and composition conceptually separable.

## Today's Mission / Daily Mission

TODO - Next design scope. Do not add checklist items yet.

## Insight

TODO

## Normalized Health Data

TODO

## Execution History

TODO - Next design scope. Do not add checklist items yet.

## Reflection

TODO - Next design scope. Do not add checklist items yet.
