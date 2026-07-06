// ======================================
// Health Pilot
// Mission Builder MVP
// ======================================

(function (root, factory) {
  const builder = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = builder;
  }

  root.MissionBuilder = builder;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const MAX_MISSIONS = 3;
  const ALLOWED_CATEGORIES = ["Sleep", "Recovery", "Activity", "Hydration", "Focus", "Mental"];

  const CATEGORY_SUMMARY = {
    Sleep: "今日は睡眠を優先しましょう。",
    Recovery: "今日は回復を優先しましょう。",
    Activity: "今日は活動量を整えましょう。",
    Hydration: "今日は水分補給を意識しましょう。",
    Focus: "今日は集中を守りましょう。",
    Mental: "今日は心の余白を作りましょう。"
  };

  const TEMPLATE_MAP = {
    Sleep: [
      {
        id: "sleep_2200",
        title: "22:00までに就寝",
        description: "回復のため、今日は22時までに休みましょう。",
        category: "Sleep",
        icon: "◌"
      },
      {
        id: "sleep_no_screen",
        title: "就寝30分前は画面を見ない",
        description: "睡眠の質を高める準備をしましょう。",
        category: "Sleep",
        icon: "◌"
      }
    ],
    Recovery: [
      {
        id: "recovery_stretch",
        title: "5分ストレッチ",
        description: "身体をほぐして回復を促します。",
        category: "Recovery",
        icon: "▭"
      },
      {
        id: "recovery_breath",
        title: "深呼吸3分",
        description: "心を落ち着かせてリセットします。",
        category: "Recovery",
        icon: "▭"
      }
    ],
    Activity: [
      {
        id: "activity_walk_10",
        title: "10分歩く",
        description: "軽く身体を動かしましょう。",
        category: "Activity",
        icon: "•"
      }
    ],
    Hydration: [
      {
        id: "hydration_water",
        title: "コップ1杯の水を飲む",
        description: "まずは水分補給から始めましょう。",
        category: "Hydration",
        icon: "•"
      }
    ],
    Focus: [
      {
        id: "focus_notifications_off",
        title: "通知を30分OFF",
        description: "集中できる時間を作りましょう。",
        category: "Focus",
        icon: "▭"
      }
    ],
    Mental: [
      {
        id: "mental_journal",
        title: "気分を書き出す",
        description: "頭の中を整理して気持ちを整えます。",
        category: "Mental",
        icon: "◌"
      }
    ]
  };

  const FALLBACK_TEMPLATE_ORDER = [
    "Sleep",
    "Recovery",
    "Activity",
    "Hydration",
    "Focus",
    "Mental"
  ];

  function normalizeRecommendation(input) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const id = typeof input.id === "string" ? input.id.trim() : "";
    const objective = typeof input.objective === "string" ? input.objective.trim() : "";
    const reason = typeof input.reason === "string" ? input.reason.trim() : "";
    const priority = Number(input.priority);

    if (!id || !objective || !reason || !Number.isFinite(priority)) {
      return null;
    }

    return {
      id,
      objective,
      reason,
      priority: Math.max(1, Math.round(priority))
    };
  }

  function inferCategory(recommendation) {
    const id = String(recommendation.id || "").toLowerCase();
    const objective = String(recommendation.objective || "").toLowerCase();
    const reason = String(recommendation.reason || "").toLowerCase();
    const source = `${id} ${objective} ${reason}`;

    if (/(sleep|rest|night|bed|recover)/.test(source)) return "Sleep";
    if (/(stress|mental|calm|anxiety|emotion|reset|breath)/.test(source)) return "Mental";
    if (/(workload|focus|consisten|priority|concentrat)/.test(source)) return "Focus";
    if (/(walk|move|activity|exercise)/.test(source)) return "Activity";
    if (/(water|hydrate|hydration)/.test(source)) return "Hydration";
    return "Recovery";
  }

  function ensureCategory(category) {
    return ALLOWED_CATEGORIES.includes(category) ? category : "Recovery";
  }

  function selectTemplate(category, usedTemplateIds, pickIndexByCategory) {
    const safeCategory = ensureCategory(category);
    const templates = TEMPLATE_MAP[safeCategory] || TEMPLATE_MAP.Recovery;
    const startIndex = pickIndexByCategory[safeCategory] || 0;

    for (let offset = 0; offset < templates.length; offset += 1) {
      const candidate = templates[(startIndex + offset) % templates.length];
      if (!usedTemplateIds.has(candidate.id)) {
        pickIndexByCategory[safeCategory] = (startIndex + offset + 1) % templates.length;
        usedTemplateIds.add(candidate.id);
        return candidate;
      }
    }

    const fallback = templates[startIndex % templates.length];
    pickIndexByCategory[safeCategory] = (startIndex + 1) % templates.length;
    usedTemplateIds.add(fallback.id);
    return fallback;
  }

  function buildMissionFromTemplate(template, priority, seed) {
    return {
      id: `${template.id}_${seed}`,
      title: template.title,
      description: template.description,
      category: template.category,
      icon: template.icon,
      priority
    };
  }

  function generateMissions(recommendationsInput) {
    const recommendations = Array.isArray(recommendationsInput)
      ? recommendationsInput.map(normalizeRecommendation).filter(Boolean)
      : [];

    const sortedRecommendations = recommendations
      .slice()
      .sort(function (left, right) {
        if (left.priority !== right.priority) {
          return left.priority - right.priority;
        }

        return left.id.localeCompare(right.id);
      });

    const usedTemplateIds = new Set();
    const pickIndexByCategory = {};
    const missions = [];

    for (let index = 0; index < sortedRecommendations.length && missions.length < MAX_MISSIONS; index += 1) {
      const recommendation = sortedRecommendations[index];
      const category = inferCategory(recommendation);
      const template = selectTemplate(category, usedTemplateIds, pickIndexByCategory);

      missions.push(buildMissionFromTemplate(template, recommendation.priority, recommendation.id));
    }

    let fallbackCursor = 0;
    while (missions.length < MAX_MISSIONS) {
      const category = FALLBACK_TEMPLATE_ORDER[fallbackCursor % FALLBACK_TEMPLATE_ORDER.length];
      const template = selectTemplate(category, usedTemplateIds, pickIndexByCategory);
      const fallbackPriority = 100 + missions.length;

      missions.push(buildMissionFromTemplate(template, fallbackPriority, `fallback_${missions.length + 1}`));
      fallbackCursor += 1;
    }

    return missions
      .sort(function (left, right) {
        if (left.priority !== right.priority) {
          return left.priority - right.priority;
        }

        return left.id.localeCompare(right.id);
      })
      .slice(0, MAX_MISSIONS);
  }

  function generateMissionSummary(missionsInput) {
    const missions = Array.isArray(missionsInput) ? missionsInput : [];
    const firstMission = missions[0] && typeof missions[0] === "object" ? missions[0] : null;
    const category = ensureCategory(firstMission ? firstMission.category : "Recovery");
    const title = firstMission && typeof firstMission.title === "string" && firstMission.title.trim()
      ? firstMission.title.trim()
      : "5分ストレッチ";
    const firstLine = CATEGORY_SUMMARY[category] || CATEGORY_SUMMARY.Recovery;

    return `${firstLine}\n\nまずは「${title}」から始めるのがおすすめです。`;
  }

  return {
    MAX_MISSIONS,
    ALLOWED_CATEGORIES,
    generateMissions,
    createMissions: generateMissions,
    generateMissionSummary
  };
});

console.log("Mission Builder loaded");