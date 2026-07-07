// ======================================
// Health Pilot
// Mission Engine v1
// ======================================

(function (root, factory) {
  const engine = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = engine;
  }

  root.MissionEngine = engine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const MAX_TOP_MISSIONS = 3;

  const TEMPLATE_BANK = {
    protect_recovery: [
      {
        id: "recovery_sleep_2200",
        title: "22:00までに就寝",
        conciseDescription: "今夜は22:00までに就寝して回復余力を確保します。",
        category: "Sleep",
        baseImpact: 3,
        basePriority: 92,
        rationale: "睡眠が現在もっとも改善効果の高い行動です。",
        icon: "◌",
        estimatedMinutes: 15
      },
      {
        id: "recovery_breath_5",
        title: "5分の呼吸リセット",
        conciseDescription: "5分の呼吸で生理的ストレスを下げて回復を優先します。",
        category: "Recovery",
        baseImpact: 1,
        basePriority: 86,
        rationale: "短時間の鎮静行動が回復余力の低下を防ぎます。",
        icon: "◌",
        estimatedMinutes: 5
      }
    ],
    reduce_stress_load: [
      {
        id: "stress_notification_off_30",
        title: "通知を30分OFF",
        conciseDescription: "通知を30分止めて認知負荷を下げ、ストレス連鎖を抑えます。",
        category: "Focus",
        baseImpact: 2,
        basePriority: 84,
        rationale: "割り込みを減らすことが明日の余力改善に直結します。",
        icon: "▭",
        estimatedMinutes: 30
      },
      {
        id: "stress_walk_10",
        title: "10分の外歩き",
        conciseDescription: "10分の外歩きで緊張を下げ、気分をリセットします。",
        category: "Mental",
        baseImpact: 2,
        basePriority: 82,
        rationale: "軽い歩行はストレス反応を下げる即効性の高い選択です。",
        icon: "•",
        estimatedMinutes: 10
      }
    ],
    trim_workload: [
      {
        id: "workload_trim_3",
        title: "今日の優先3つに絞る",
        conciseDescription: "今日の作業を3件に絞ってエネルギー消耗を抑えます。",
        category: "Focus",
        baseImpact: 2,
        basePriority: 80,
        rationale: "負荷の上限管理が明日のCapacity低下を防ぎます。",
        icon: "▭",
        estimatedMinutes: 8
      },
      {
        id: "workload_buffer_break",
        title: "午後に10分バッファ",
        conciseDescription: "午後に10分の余白を確保し、負荷の蓄積を避けます。",
        category: "Recovery",
        baseImpact: 1,
        basePriority: 76,
        rationale: "短い回復バッファが後半の失速を防ぎます。",
        icon: "◌",
        estimatedMinutes: 10
      }
    ],
    protect_consistency: [
      {
        id: "consistency_water",
        title: "午前中に水を2回",
        conciseDescription: "午前中に2回の水分補給で安定したコンディションを保ちます。",
        category: "Hydration",
        baseImpact: 1,
        basePriority: 70,
        rationale: "低負荷で継続しやすい行動が改善傾向を維持します。",
        icon: "•",
        estimatedMinutes: 3
      },
      {
        id: "consistency_walk_8",
        title: "8分の軽い散歩",
        conciseDescription: "8分の軽い散歩で良いリズムを維持しつつ負担を抑えます。",
        category: "Activity",
        baseImpact: 1,
        basePriority: 68,
        rationale: "小さな再現可能行動が明日の安定につながります。",
        icon: "•",
        estimatedMinutes: 8
      }
    ],
    maintain_balance: [
      {
        id: "balance_mobility_6",
        title: "6分のモビリティ",
        conciseDescription: "6分のモビリティで身体負荷を均し、安定を維持します。",
        category: "Recovery",
        baseImpact: 1,
        basePriority: 64,
        rationale: "安定日は過負荷を避ける維持行動が最適です。",
        icon: "◌",
        estimatedMinutes: 6
      },
      {
        id: "balance_focus_block",
        title: "集中25分ブロック",
        conciseDescription: "25分だけ集中して、疲労が増える前に切り上げます。",
        category: "Focus",
        baseImpact: 2,
        basePriority: 66,
        rationale: "集中時間の上限管理が明日の余力を守ります。",
        icon: "▭",
        estimatedMinutes: 25
      }
    ],
    fallback: [
      {
        id: "fallback_breath_3",
        title: "3分だけ深呼吸",
        conciseDescription: "3分の深呼吸で即時に緊張を下げ、回復余地を作ります。",
        category: "Mental",
        baseImpact: 1,
        basePriority: 40,
        rationale: "不確実な日は安全で効果の高い鎮静行動を優先します。",
        icon: "◌",
        estimatedMinutes: 3
      },
      {
        id: "fallback_walk_5",
        title: "5分だけ歩く",
        conciseDescription: "5分の歩行で無理なく循環を上げ、状態を整えます。",
        category: "Activity",
        baseImpact: 1,
        basePriority: 38,
        rationale: "低リスクの軽運動が全体状態の底上げに有効です。",
        icon: "•",
        estimatedMinutes: 5
      }
    ]
  };

  const RATIONALE_BY_RECOMMENDATION = {
    protect_recovery: "睡眠と回復行動が現在の改善効果として最優先です。",
    reduce_stress_load: "ストレス要因の削減が明日のCapacity改善に最短です。",
    trim_workload: "作業負荷の圧縮がCapacity低下リスクを最も下げます。",
    protect_consistency: "継続しやすい小行動の積み上げが最も安定的です。",
    maintain_balance: "維持行動で過負荷を避けることが最適解です。",
    fallback: "安全で実行しやすい行動から始めるのが最善です。"
  };

  function normalizeRecommendation(item) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const id = typeof item.id === "string" ? item.id.trim() : "";
    const objective = typeof item.objective === "string" ? item.objective.trim() : "";
    const reason = typeof item.reason === "string" ? item.reason.trim() : "";
    const priority = Number(item.priority);

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

  function normalizeRecommendations(input) {
    return Array.isArray(input)
      ? input.map(normalizeRecommendation).filter(Boolean)
      : [];
  }

  function normalizeContext(input) {
    const source = input && typeof input === "object" ? input : {};

    const recovery = String(source.recovery || "medium").toLowerCase();
    const stress = String(source.stress || "medium").toLowerCase();
    const focusDemand = String(source.focusDemand || "medium").toLowerCase();
    const energy = String(source.energy || "medium").toLowerCase();
    const primaryLeverage = String(source.primaryLeverage || "consistency").toLowerCase();
    const recommendationMode = String(source.recommendationMode || "balanced").toLowerCase();
    const confidence = Number(source.confidence);

    return {
      recovery: recovery === "low" || recovery === "high" ? recovery : "medium",
      stress: stress === "low" || stress === "high" ? stress : "medium",
      sleepDebt: Boolean(source.sleepDebt),
      focusDemand: focusDemand === "low" || focusDemand === "high" ? focusDemand : "medium",
      energy: energy === "low" || energy === "high" ? energy : "medium",
      confidence: Number.isFinite(confidence) ? Math.max(0.55, Math.min(0.95, confidence)) : 0.7,
      primaryLeverage,
      recommendationMode
    };
  }

  function resolveTemplateList(recommendationId) {
    return TEMPLATE_BANK[recommendationId] || TEMPLATE_BANK.fallback;
  }

  function buildCandidate(template, recommendation, rankIndex, templateIndex, context) {
    const category = String(template.category || "").toLowerCase();

    const isSleepOrRecovery = /sleep|recovery/.test(category);
    const isFocusOrMental = /focus|mental/.test(category);
    const isConsistencyCategory = /hydration|activity/.test(category);

    const recommendationWeight = Math.max(0, 6 - recommendation.priority) * 3;
    const rankPenalty = rankIndex * 2;
    const lowEnergyBoost = context.energy === "low" && isSleepOrRecovery ? 4 : context.energy === "medium" && isSleepOrRecovery ? 1 : 0;
    const sleepDebtBoost = context.sleepDebt && isSleepOrRecovery ? 5 : 0;
    const stressBoost = context.stress === "high" && (isFocusOrMental || isSleepOrRecovery)
      ? 3
      : context.stress === "medium" && isFocusOrMental ? 1 : 0;
    const focusDemandBoost = context.focusDemand === "high" && /focus/.test(category)
      ? 3
      : context.focusDemand === "medium" && /focus/.test(category) ? 1 : 0;
    const recoveryModeBoost = context.recommendationMode === "recovery" && isSleepOrRecovery ? 2 : 0;

    let leverageBoost = 0;

    if (context.primaryLeverage === "sleep" && isSleepOrRecovery) {
      leverageBoost = 3;
    } else if (context.primaryLeverage === "stress" && (isFocusOrMental || isSleepOrRecovery)) {
      leverageBoost = 3;
    } else if (context.primaryLeverage === "focus" && /focus/.test(category)) {
      leverageBoost = 3;
    } else if (context.primaryLeverage === "recovery" && isSleepOrRecovery) {
      leverageBoost = 2;
    } else if (context.primaryLeverage === "consistency" && isConsistencyCategory) {
      leverageBoost = 2;
    }

    const priority = template.basePriority
      + recommendationWeight
      + lowEnergyBoost
      + sleepDebtBoost
      + stressBoost
      + focusDemandBoost
      + recoveryModeBoost
      + leverageBoost
      - rankPenalty;

    const impact = Math.max(
      1,
      Math.min(
        4,
        Math.round(
          template.baseImpact
          + recommendationWeight / 14
          + (context.sleepDebt && isSleepOrRecovery ? 1 : 0)
          + (context.stress === "high" && isFocusOrMental ? 1 : 0)
          - rankIndex * 1.5
          - templateIndex * 0.5
        )
      )
    );
    const confidence = Math.max(0.55, Math.min(0.95, context.confidence + (priority - 70) / 220));
    const rationale = RATIONALE_BY_RECOMMENDATION[recommendation.id] || template.rationale;

    return {
      id: `${template.id}_${recommendation.id}`,
      title: template.title,
      conciseDescription: template.conciseDescription,
      impact,
      priority,
      confidence: Number(confidence.toFixed(2)),
      category: template.category,
      rationale,
      icon: template.icon,
      action: template.title,
      estimatedMinutes: template.estimatedMinutes
    };
  }

  function generateCandidateMissions(input) {
    const source = input && typeof input === "object" ? input : {};
    const recommendations = normalizeRecommendations(source.recommendations);
    const context = normalizeContext(source.context);

    const candidates = [];

    recommendations.forEach(function (recommendation, rankIndex) {
      const templates = resolveTemplateList(recommendation.id);

      templates.forEach(function (template, templateIndex) {
        candidates.push(buildCandidate(template, recommendation, rankIndex, templateIndex, context));
      });
    });

    if (!candidates.length) {
      const fallbackRecommendation = {
        id: "fallback",
        objective: "回復を優先",
        reason: "推奨が不足したため安全なフォールバックを使用します。",
        priority: 99
      };

      TEMPLATE_BANK.fallback.forEach(function (template, templateIndex) {
        candidates.push(buildCandidate(template, fallbackRecommendation, 0, templateIndex, context));
      });
    }

    return candidates;
  }

  function prioritizeCandidates(candidatesInput) {
    const candidates = Array.isArray(candidatesInput) ? candidatesInput.slice() : [];

    return candidates.sort(function (left, right) {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }

      if (right.impact !== left.impact) {
        return right.impact - left.impact;
      }

      return String(left.id || "").localeCompare(String(right.id || ""));
    });
  }

  function selectTopMissions(prioritizedInput, maxCount) {
    const prioritized = Array.isArray(prioritizedInput) ? prioritizedInput : [];
    const limit = Number.isFinite(Number(maxCount)) ? Math.max(1, Math.round(Number(maxCount))) : MAX_TOP_MISSIONS;

    return prioritized.slice(0, limit);
  }

  function generateMissionSummary(missionsInput) {
    const missions = Array.isArray(missionsInput) ? missionsInput : [];
    const top = missions[0] && typeof missions[0] === "object" ? missions[0] : null;

    if (!top) {
      return "今日は回復を優先しましょう。\n\nまずは小さな一歩から始めましょう。";
    }

    return `今日は「${top.title}」を優先しましょう。\n\nまずは今すぐ着手するとTomorrow +${top.impact}が見込めます。`;
  }

  function buildMissionPlan(input) {
    const candidates = generateCandidateMissions(input);
    const prioritized = prioritizeCandidates(candidates);
    const topMissions = selectTopMissions(prioritized, MAX_TOP_MISSIONS);
    const topMission = topMissions[0] || null;

    return {
      candidates,
      prioritized,
      topMissions,
      topMission,
      why: topMission ? topMission.rationale : "今日の状態に合わせた小さな一歩です。"
    };
  }

  return {
    MAX_TOP_MISSIONS,
    generateCandidateMissions,
    prioritizeCandidates,
    selectTopMissions,
    generateMissionSummary,
    buildMissionPlan
  };
});

console.log("Mission Engine loaded");
