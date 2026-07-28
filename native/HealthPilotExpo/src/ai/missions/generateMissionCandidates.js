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

const FALLBACK_SLEEP_BEFORE_2300_CANDIDATE = Object.freeze({
  id: "sleep_before_2300",
  type: "sleep",
  title: "23:00までに就寝",
  rationale: "明日の回復に向けて、今夜の睡眠時間を確保するため",
  evidenceSummary: "就寝時刻を安定させることは、回復と日中パフォーマンスの土台になります。",
  estimatedDurationMinutes: 5,
});

const FALLBACK_WALK_AFTER_DINNER_10MIN_CANDIDATE = Object.freeze({
  id: "walk_after_dinner_10min",
  type: "activity",
  title: "夕食後に10分歩く",
  rationale: "軽い活動で今日のリズムを整えるため",
  evidenceSummary: "短時間の歩行は、食後のだるさ軽減や気分の安定に役立つ可能性があります。",
  estimatedDurationMinutes: 10,
});

const FALLBACK_NO_CAFFEINE_AFTER_1500_CANDIDATE = Object.freeze({
  id: "no_caffeine_after_1500",
  type: "recovery",
  title: "15時以降カフェインなし",
  rationale: "今夜の入眠を妨げる要因を減らすため",
  evidenceSummary: "午後後半のカフェインを控えることは、睡眠の質維持に役立つ可能性があります。",
  estimatedDurationMinutes: 1,
});

const MISSION_CANDIDATES_BY_INSIGHT_TYPE = Object.freeze({
  short_main_sleep: SHORT_MAIN_SLEEP_CANDIDATE,
  low_activity: LOW_ACTIVITY_CANDIDATE,
});

const FALLBACK_MISSION_DEFINITIONS = Object.freeze([
  FALLBACK_SLEEP_BEFORE_2300_CANDIDATE,
  FALLBACK_WALK_AFTER_DINNER_10MIN_CANDIDATE,
  FALLBACK_NO_CAFFEINE_AFTER_1500_CANDIDATE,
]);

function getInsightId(insight) {
  return typeof insight?.id === "string" ? insight.id.trim() : "";
}

function toPositiveInteger(value, fallbackValue) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallbackValue;
  }

  return Math.max(1, Math.round(numeric));
}

function createCandidateFromDefinition(definition, sourceInsightIds) {
  return {
    id: definition.id,
    sourceInsightIds: Array.isArray(sourceInsightIds) ? sourceInsightIds : [],
    type: definition.type,
    title: definition.title,
    rationale: definition.rationale,
    evidenceSummary: definition.evidenceSummary,
    estimatedDurationMinutes: toPositiveInteger(definition.estimatedDurationMinutes, 15),
  };
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

    candidatesById.set(template.id, createCandidateFromDefinition(template, [insightId]));
  }

  return Array.from(candidatesById.values());
}

export function generateFallbackMissionCandidates(existingCandidates = [], maxCount = 3) {
  const limit = Number.isFinite(Number(maxCount)) ? Math.max(0, Math.round(Number(maxCount))) : 3;

  if (limit === 0) {
    return [];
  }

  const existingIds = new Set(
    (Array.isArray(existingCandidates) ? existingCandidates : [])
      .map((candidate) => (typeof candidate?.id === "string" ? candidate.id.trim() : ""))
      .filter(Boolean),
  );
  const fallbacks = [];

  for (const definition of FALLBACK_MISSION_DEFINITIONS) {
    if (fallbacks.length >= limit) {
      break;
    }

    if (existingIds.has(definition.id)) {
      continue;
    }

    existingIds.add(definition.id);
    fallbacks.push(createCandidateFromDefinition(definition, []));
  }

  return fallbacks;
}