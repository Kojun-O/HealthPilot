const CATEGORY_TO_CANDIDATE_TYPE = Object.freeze({
  sleep: "sleep",
  movement: "activity",
  recovery: "recovery",
  focus: "rest",
  nutrition: "recovery",
});

const MISSION_LIBRARY_V1 = Object.freeze([
  // sleep (8)
  {
    id: "sleep_before_2300",
    category: "sleep",
    title: "23:00までに就寝",
    rationale: "明日の回復に向けて、今夜の睡眠時間を確保するため",
    expectedImpact: 2,
    durationMinutes: 0,
  },
  {
    id: "wind_down_lights_dim_30",
    category: "sleep",
    title: "就寝30分前に照明を落とす",
    rationale: "寝る前の刺激を減らして入眠しやすくするため",
    expectedImpact: 2,
    durationMinutes: 5,
  },
  {
    id: "screen_off_30min_before_bed",
    category: "sleep",
    title: "就寝30分前は画面を見ない",
    rationale: "入眠を妨げる刺激を減らすため",
    expectedImpact: 2,
    durationMinutes: 0,
  },
  {
    id: "warm_shower_10min_before_bed",
    category: "sleep",
    title: "就寝前に10分のぬるめシャワー",
    rationale: "体を落ち着かせて寝る準備を整えるため",
    expectedImpact: 2,
    durationMinutes: 10,
  },
  {
    id: "bedroom_cool_dark_setup_5",
    category: "sleep",
    title: "寝室を涼しく暗く整える",
    rationale: "睡眠の質を下げる環境要因を減らすため",
    expectedImpact: 1,
    durationMinutes: 5,
  },
  {
    id: "wake_time_fixed_plusminus30",
    category: "sleep",
    title: "起床時刻を30分以内にそろえる",
    rationale: "体内リズムの乱れを抑えるため",
    expectedImpact: 1,
    durationMinutes: 0,
  },
  {
    id: "morning_sunlight_10min",
    category: "sleep",
    title: "朝に10分日光を浴びる",
    rationale: "睡眠リズムを整えやすくするため",
    expectedImpact: 2,
    durationMinutes: 10,
  },
  {
    id: "nap_limit_20min_before_1500",
    category: "sleep",
    title: "昼寝は15時までに20分以内",
    rationale: "夜の入眠への影響を抑えるため",
    expectedImpact: 1,
    durationMinutes: 0,
  },

  // movement (7)
  {
    id: "walk_15min",
    category: "movement",
    title: "15分歩く",
    rationale: "歩数が少なく、活動量が不足しています。",
    expectedImpact: 1,
    durationMinutes: 15,
  },
  {
    id: "walk_after_dinner_10min",
    category: "movement",
    title: "夕食後に10分歩く",
    rationale: "軽い活動で今日のリズムを整えるため",
    expectedImpact: 2,
    durationMinutes: 10,
  },
  {
    id: "march_in_place_5min_easy",
    category: "movement",
    title: "その場で5分のやさしい足踏み",
    rationale: "関節負担を抑えながら活動量を積み増すため",
    expectedImpact: 1,
    durationMinutes: 5,
  },
  {
    id: "mobility_flow_8min",
    category: "movement",
    title: "8分の全身モビリティ",
    rationale: "こわばりを減らし動きやすさを上げるため",
    expectedImpact: 2,
    durationMinutes: 8,
  },
  {
    id: "light_stretch_10min",
    category: "movement",
    title: "10分の軽いストレッチ",
    rationale: "座りっぱなしによる負担を和らげるため",
    expectedImpact: 1,
    durationMinutes: 10,
  },
  {
    id: "stand_up_2min_each_hour",
    category: "movement",
    title: "1時間ごとに2分立って歩く",
    rationale: "長時間座位を分断して負担を減らすため",
    expectedImpact: 1,
    durationMinutes: 2,
  },
  {
    id: "easy_walk_call_12min",
    category: "movement",
    title: "通話しながら12分歩く",
    rationale: "日中の活動量を無理なく増やすため",
    expectedImpact: 1,
    durationMinutes: 12,
  },

  // recovery (6)
  {
    id: "box_breathing_3min",
    category: "recovery",
    title: "3分のボックス呼吸",
    rationale: "緊張を和らげて回復しやすい状態を作るため",
    expectedImpact: 1,
    durationMinutes: 3,
  },
  {
    id: "rest_feet_up_10min",
    category: "recovery",
    title: "10分、脚を上げて休む",
    rationale: "疲労感をやわらげるため",
    expectedImpact: 1,
    durationMinutes: 10,
  },
  {
    id: "hydration_glass_water_now",
    category: "recovery",
    title: "今、コップ1杯の水を飲む",
    rationale: "無理のない水分補給でコンディション低下を防ぐため",
    expectedImpact: 1,
    durationMinutes: 2,
  },
  {
    id: "shoulder_neck_release_6min",
    category: "recovery",
    title: "首と肩のリリースを6分",
    rationale: "緊張による疲れを緩和するため",
    expectedImpact: 1,
    durationMinutes: 6,
  },
  {
    id: "body_scan_5min",
    category: "recovery",
    title: "5分のボディスキャン",
    rationale: "力みを手放して休息モードに切り替えるため",
    expectedImpact: 1,
    durationMinutes: 5,
  },
  {
    id: "quiet_reset_10min",
    category: "recovery",
    title: "10分だけ静かな環境で休む",
    rationale: "刺激を減らして脳の回復を促すため",
    expectedImpact: 1,
    durationMinutes: 10,
  },

  // focus (5)
  {
    id: "rest_eyes_closed_15min",
    category: "focus",
    title: "15分、目を閉じて休む",
    rationale: "昨夜の主睡眠が7時間未満だったため",
    expectedImpact: 1,
    durationMinutes: 15,
  },
  {
    id: "first_task_25min_focus",
    category: "focus",
    title: "最重要タスクを25分だけ進める",
    rationale: "集中の立ち上がりを作るため",
    expectedImpact: 1,
    durationMinutes: 25,
  },
  {
    id: "notification_quiet_30min",
    category: "focus",
    title: "30分だけ通知をオフにする",
    rationale: "注意の分散を減らすため",
    expectedImpact: 1,
    durationMinutes: 0,
  },
  {
    id: "desk_reset_5min",
    category: "focus",
    title: "作業前に机を5分で整える",
    rationale: "着手の摩擦を減らすため",
    expectedImpact: 1,
    durationMinutes: 5,
  },
  {
    id: "top3_priorities_5min",
    category: "focus",
    title: "今日の優先3つを書き出す",
    rationale: "判断負荷を下げて迷いを減らすため",
    expectedImpact: 1,
    durationMinutes: 5,
  },

  // nutrition (4)
  {
    id: "no_caffeine_after_1500",
    category: "nutrition",
    title: "15時以降カフェインなし",
    rationale: "今夜の入眠を妨げる要因を減らすため",
    expectedImpact: 2,
    durationMinutes: 0,
  },
  {
    id: "protein_fiber_snack_once",
    category: "nutrition",
    title: "間食するなら、たんぱく質と食物繊維を含むものを選ぶ",
    rationale: "不要な間食を増やさずエネルギー変動を抑えるため",
    expectedImpact: 1,
    durationMinutes: 0,
  },
  {
    id: "water_before_coffee_250ml",
    category: "nutrition",
    title: "コーヒー前に水を250ml飲む",
    rationale: "水分不足によるだるさを防ぐため",
    expectedImpact: 1,
    durationMinutes: 2,
  },
  {
    id: "balanced_plate_next_meal",
    category: "nutrition",
    title: "次の食事を主食・主菜・副菜で整える",
    rationale: "午後のパフォーマンス低下を防ぐため",
    expectedImpact: 1,
    durationMinutes: 0,
  },
]);

const INSIGHT_TO_MISSION_IDS = Object.freeze({
  short_main_sleep: Object.freeze([
    "rest_eyes_closed_15min",
    "sleep_before_2300",
    "walk_after_dinner_10min",
    "no_caffeine_after_1500",
    "wind_down_lights_dim_30",
    "screen_off_30min_before_bed",
    "morning_sunlight_10min",
    "box_breathing_3min",
  ]),
  low_activity: Object.freeze([
    "walk_15min",
    "walk_after_dinner_10min",
    "march_in_place_5min_easy",
    "mobility_flow_8min",
    "stand_up_2min_each_hour",
    "easy_walk_call_12min",
    "light_stretch_10min",
  ]),
});

const CANDIDATE_PRIORITY_IDS = Object.freeze([
  "rest_eyes_closed_15min",
  "walk_15min",
  "sleep_before_2300",
  "walk_after_dinner_10min",
  "no_caffeine_after_1500",
]);

const FALLBACK_MISSION_IDS = Object.freeze([
  "sleep_before_2300",
  "walk_after_dinner_10min",
  "no_caffeine_after_1500",
]);

const MISSION_DEFINITION_BY_ID = Object.freeze(
  MISSION_LIBRARY_V1.reduce((result, definition) => {
    result[definition.id] = Object.freeze({ ...definition });
    return result;
  }, {}),
);

const CANDIDATE_PRIORITY_BY_ID = Object.freeze(
  CANDIDATE_PRIORITY_IDS.reduce((result, missionId, index) => {
    result[missionId] = index;
    return result;
  }, {}),
);

function getInsightId(insight) {
  return typeof insight?.id === "string" ? insight.id.trim() : "";
}

function toDurationMinutesOrDefault(value, fallbackValue) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallbackValue;
  }

  if (numeric < 0) {
    return fallbackValue;
  }

  if (numeric === 0) {
    return 0;
  }

  return Math.max(1, Math.round(numeric));
}

function toExpectedImpact(value, fallbackValue = 1) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallbackValue;
  }

  return Math.min(3, Math.max(1, Math.round(numeric)));
}

function toCandidateType(category) {
  if (typeof category !== "string") {
    return "recovery";
  }

  return CATEGORY_TO_CANDIDATE_TYPE[category] || "recovery";
}

function getDefinitionById(missionId) {
  if (typeof missionId !== "string") {
    return null;
  }

  return MISSION_DEFINITION_BY_ID[missionId] || null;
}

function getCandidatePriority(candidate) {
  if (!candidate || typeof candidate !== "object") {
    return Number.MAX_SAFE_INTEGER;
  }

  const priority = CANDIDATE_PRIORITY_BY_ID[candidate.id];

  if (Number.isInteger(priority)) {
    return priority;
  }

  return CANDIDATE_PRIORITY_IDS.length;
}

function sortCandidates(candidates) {
  return [...candidates].sort((left, right) => getCandidatePriority(left) - getCandidatePriority(right));
}

function createCandidateFromDefinition(definition, sourceInsightIds) {
  return {
    id: definition.id,
    sourceInsightIds: Array.isArray(sourceInsightIds) ? sourceInsightIds : [],
    type: toCandidateType(definition.category),
    title: definition.title,
    rationale: definition.rationale,
    expectedImpact: toExpectedImpact(definition.expectedImpact, 1),
    estimatedDurationMinutes: toDurationMinutesOrDefault(definition.durationMinutes, 15),
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

    const missionIds = INSIGHT_TO_MISSION_IDS[insight.type];

    if (!Array.isArray(missionIds) || missionIds.length === 0) {
      continue;
    }

    const insightId = getInsightId(insight);

    if (!insightId) {
      continue;
    }

    for (const missionId of missionIds) {
      const definition = getDefinitionById(missionId);

      if (!definition) {
        continue;
      }

      const existingCandidate = candidatesById.get(definition.id);

      if (existingCandidate) {
        if (!existingCandidate.sourceInsightIds.includes(insightId)) {
          existingCandidate.sourceInsightIds.push(insightId);
        }

        continue;
      }

      candidatesById.set(definition.id, createCandidateFromDefinition(definition, [insightId]));
    }
  }

  return sortCandidates(Array.from(candidatesById.values()));
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

  for (const missionId of FALLBACK_MISSION_IDS) {
    if (fallbacks.length >= limit) {
      break;
    }

    const definition = getDefinitionById(missionId);

    if (!definition) {
      continue;
    }

    if (existingIds.has(definition.id)) {
      continue;
    }

    existingIds.add(definition.id);
    fallbacks.push(createCandidateFromDefinition(definition, []));
  }

  return fallbacks;
}