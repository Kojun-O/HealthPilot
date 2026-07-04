// ======================================
// Health Pilot
// Decision Engine v2
// ======================================

(function (root, factory) {
  const engine = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = engine;
  }

  root.DecisionEngine = engine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const missionTemplates = [
    {
      id: "breathe",
      title: "深呼吸",
      reason: "心を落ち着けて、今の状態に合わせます。",
      category: "recovery",
      baseScore: 8,
      rank: 1
    },
    {
      id: "drink_water",
      title: "水を飲む",
      reason: "水分を補給して、体を支えます。",
      category: "hydration",
      baseScore: 7,
      rank: 2
    },
    {
      id: "walk_10_min",
      title: "10分歩く",
      reason: "軽く動いて、気分を切り替えます。",
      category: "movement",
      baseScore: 6,
      rank: 3
    },
    {
      id: "stretch",
      title: "ストレッチ",
      reason: "体のこわばりをほぐします。",
      category: "recovery",
      baseScore: 5,
      rank: 4
    },
    {
      id: "short_focus",
      title: "短い集中",
      reason: "ひとつに集中して、進めます。",
      category: "focus",
      baseScore: 5,
      rank: 5
    },
    {
      id: "early_sleep",
      title: "早めに寝る",
      reason: "回復のために、早めに休みます。",
      category: "sleep",
      baseScore: 4,
      rank: 6
    },
    {
      id: "sunlight",
      title: "日差し",
      reason: "自然光で気分を整えます。",
      category: "mental",
      baseScore: 4,
      rank: 7
    },
    {
      id: "rest",
      title: "休む",
      reason: "回復を優先して、無理をしません。",
      category: "recovery",
      baseScore: 3,
      rank: 8
    },
    {
      id: "mood_reset",
      title: "気分を整える",
      reason: "気分を切り替えて、前向きに進めます。",
      category: "mental",
      baseScore: 3,
      rank: 9
    }
  ];

  function clampScore(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(100, Math.max(0, Math.round(number)));
  }

  function normalizeDecisionInput(input) {
    if (input == null || typeof input !== "object") {
      input = {};
    }

    return {
      sleep: clampScore(input.sleep ?? input.sleepScore ?? 70, 70),
      condition: clampScore(input.condition ?? input.recoveryScore ?? input.conditionScore ?? 70, 70),
      stress: clampScore(input.stress ?? input.stressLevel ?? 40, 40),
      exercise: clampScore(input.exercise ?? input.energyLevel ?? input.exerciseScore ?? 60, 60),
      mood: clampScore(input.mood ?? input.moodScore ?? input.focusLevel ?? 70, 70),
      focus: clampScore(input.focus ?? input.focusLevel ?? 70, 70),
      weather: typeof input.weather === "string" ? input.weather : "",
      temperature: Number.isFinite(Number(input.temperature)) ? Number(input.temperature) : null,
      uvIndex: Number.isFinite(Number(input.uvIndex)) ? Number(input.uvIndex) : null,
      pollenLevel: Number.isFinite(Number(input.pollenLevel)) ? Number(input.pollenLevel) : null,
      rainChance: Number.isFinite(Number(input.rainChance)) ? Number(input.rainChance) : null,
      yesterdayCompletionRate: Number.isFinite(Number(input.yesterdayCompletionRate)) ? Number(input.yesterdayCompletionRate) : null
    };
  }

  function scoreCandidate(candidate, signals) {
    let score = candidate.baseScore || 0;
    const {
      sleep,
      condition,
      stress,
      exercise,
      mood,
      focus,
      weather,
      temperature,
      uvIndex,
      rainChance
    } = signals;

    if (candidate.id === "breathe") {
      if (stress >= 70) score += 24;
      if (sleep <= 45) score += 14;
      if (mood <= 45) score += 10;
      if (condition <= 45) score += 8;
    }

    if (candidate.id === "drink_water") {
      if (temperature !== null && temperature >= 28) score += 18;
      if (uvIndex !== null && uvIndex >= 7) score += 14;
      if (exercise >= 70) score += 10;
      if (sleep <= 55 || condition <= 50) score += 8;
    }

    if (candidate.id === "walk_10_min") {
      if (exercise <= 45) score += 24;
      if (mood <= 50) score += 14;
      if (stress >= 60) score += 12;
      if (rainChance !== null && rainChance <= 30 && weather !== "rainy") score += 6;
    }

    if (candidate.id === "stretch") {
      if (condition <= 45) score += 20;
      if (stress >= 60) score += 12;
      if (sleep <= 50) score += 8;
      if (exercise >= 60) score += 6;
    }

    if (candidate.id === "short_focus") {
      if (focus <= 45) score += 24;
      if (focus <= 60) score += 10;
      if (sleep <= 55) score += 8;
      if (stress >= 60) score += 6;
    }

    if (candidate.id === "early_sleep") {
      if (sleep <= 45) score += 28;
      if (sleep <= 60) score += 16;
      if (stress >= 70) score += 10;
    }

    if (candidate.id === "sunlight") {
      if (weather === "sunny") score += 18;
      if (temperature !== null && temperature >= 24) score += 12;
      if (mood <= 50) score += 10;
      if (sleep <= 60) score += 8;
    }

    if (candidate.id === "rest") {
      if (condition <= 35) score += 22;
      if (condition <= 50) score += 14;
      if (stress >= 70) score += 12;
      if (sleep <= 45) score += 10;
    }

    if (candidate.id === "mood_reset") {
      if (mood <= 45) score += 24;
      if (mood <= 60) score += 12;
      if (stress >= 60) score += 10;
      if (exercise <= 45) score += 8;
    }

    return score;
  }

  function normalizeMissionTitle(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "");
  }

  function isNearDuplicate(candidate, selectedMissions) {
    const candidateKey = normalizeMissionTitle(candidate.id || candidate.title);

    return selectedMissions.some((mission) => {
      const currentKey = normalizeMissionTitle(mission.id || mission.title);
      return candidateKey === currentKey
        || currentKey.includes(candidateKey)
        || candidateKey.includes(currentKey);
    });
  }

  function buildMission(candidate, priorityScore) {
    return {
      id: candidate.id,
      title: candidate.title,
      reason: candidate.reason,
      priorityScore,
      category: candidate.category
    };
  }

  function generateDailyMissions(input) {
    const signals = normalizeDecisionInput(input);
    const rankedCandidates = missionTemplates
      .map((candidate) => ({
        candidate,
        priorityScore: scoreCandidate(candidate, signals)
      }))
      .sort((left, right) => right.priorityScore - left.priorityScore || left.candidate.rank - right.candidate.rank);

    const selectedMissions = [];

    for (const entry of rankedCandidates) {
      if (selectedMissions.length >= 3) break;

      if (isNearDuplicate(entry.candidate, selectedMissions)) {
        continue;
      }

      selectedMissions.push(buildMission(entry.candidate, entry.priorityScore));
    }

    if (selectedMissions.length < 3) {
      for (const entry of rankedCandidates) {
        if (selectedMissions.length >= 3) break;

        if (isNearDuplicate(entry.candidate, selectedMissions)) {
          continue;
        }

        selectedMissions.push(buildMission(entry.candidate, entry.priorityScore));
      }
    }

    return selectedMissions
      .sort((left, right) => right.priorityScore - left.priorityScore || left.id.localeCompare(right.id))
      .slice(0, 3);
  }

  return {
    normalizeDecisionInput,
    generateDailyMissions
  };
});

console.log("Decision Engine v2 loaded");
