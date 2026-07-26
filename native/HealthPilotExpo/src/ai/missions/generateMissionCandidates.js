const SHORT_MAIN_SLEEP_CANDIDATE = Object.freeze({
  id: "rest_eyes_closed_15min",
  type: "rest",
  title: "15分、目を閉じて休む",
  rationale: "昨夜の主睡眠が7時間未満だったため",
  evidenceSummary: "短時間の閉眼休息は、主観的な眠気や疲労感を軽減する可能性があります。",
  estimatedDurationMinutes: 15,
});

const LOW_ACTIVITY_CANDIDATE = Object.freeze({
  id: "walk_15min",
  type: "activity",
  title: "15分歩く",
  rationale: "歩数が少なく、活動量が不足しています。",
  evidenceSummary: "短時間の軽い歩行は、覚醒感や気分、日中の活動性の改善に役立つ可能性があります。",
  estimatedDurationMinutes: 15,
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
      evidenceSummary: template.evidenceSummary,
      estimatedDurationMinutes: template.estimatedDurationMinutes,
    });
  }

  return Array.from(candidatesById.values());
}