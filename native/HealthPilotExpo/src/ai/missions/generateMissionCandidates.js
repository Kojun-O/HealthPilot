const SHORT_MAIN_SLEEP_CANDIDATE = Object.freeze({
  id: "short-main-sleep-rest",
  type: "rest",
  title: "昼休みに15分、目を閉じて休む",
  rationale: "昨夜の主睡眠が7時間未満だったため",
});

const LOW_ACTIVITY_CANDIDATE = Object.freeze({
  id: "low-activity-walk",
  type: "activity",
  title: "今日は15分だけ外を歩く",
  rationale: "歩数が少なく、活動量が不足しています。",
});

const MISSION_CANDIDATES_BY_INSIGHT_TYPE = Object.freeze({
  short_main_sleep: SHORT_MAIN_SLEEP_CANDIDATE,
  low_activity: LOW_ACTIVITY_CANDIDATE,
});

function getInsightId(insight) {
  return typeof insight?.id === "string" ? insight.id.trim() : "";
}

export function generateMissionCandidates(insights) {
  if (!Array.isArray(insights)) {
    return [];
  }

  const candidatesById = new Map();

  for (const insight of insights) {
    if (!insight || typeof insight !== "object") {
      continue;
    }

    const template = MISSION_CANDIDATES_BY_INSIGHT_TYPE[insight.type];

    if (!template) {
      continue;
    }

    const insightId = getInsightId(insight);

    if (!insightId) {
      continue;
    }

    const existingCandidate = candidatesById.get(template.id);

    if (existingCandidate) {
      if (!existingCandidate.sourceInsightIds.includes(insightId)) {
        existingCandidate.sourceInsightIds.push(insightId);
      }

      continue;
    }

    candidatesById.set(template.id, {
      id: template.id,
      sourceInsightIds: [insightId],
      type: template.type,
      title: template.title,
      rationale: template.rationale,
    });
  }

  return Array.from(candidatesById.values());
}