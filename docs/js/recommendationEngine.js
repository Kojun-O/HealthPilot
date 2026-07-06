// ======================================
// Health Pilot
// Recommendation Engine v1
// ======================================

(function (root, factory) {
  const engine = factory(root);

  if (typeof module !== "undefined" && module.exports) {
    module.exports = engine;
  }

  root.RecommendationEngine = engine;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  const MAX_RECOMMENDATIONS = 3;
  const contextUnderstanding = resolveContextUnderstanding(root);

  const DEFAULT_CAPACITY_OUTPUT = {
    capacity: 60,
    status: "Balanced",
    factors: []
  };

  const MOCK_DAILY_CONTEXT = {
    timeOfDay: "morning",
    weekday: 1,
    recentCompletionRate: 67,
    streakDays: 3,
    category: "",
    note: ""
  };

  function resolveContextUnderstanding(scope) {
    if (scope && scope.ContextUnderstanding && typeof scope.ContextUnderstanding.analyzeContext === "function") {
      return scope.ContextUnderstanding;
    }

    if (typeof require === "function") {
      try {
        const contextModule = require("./contextUnderstanding.js");

        if (contextModule && typeof contextModule.analyzeContext === "function") {
          return contextModule;
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  function clampPercent(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(100, Math.max(0, Math.round(number)));
  }

  function normalizeFactor(factor) {
    if (!factor || typeof factor !== "object") {
      return null;
    }

    const name = typeof factor.name === "string" ? factor.name.trim() : "";

    if (!name) {
      return null;
    }

    const impact = Number(factor.impact);

    return {
      name,
      impact: Number.isFinite(impact) ? Math.round(impact) : 0
    };
  }

  function normalizeCapacityOutput(input) {
    const source = input && typeof input === "object" ? input : {};
    const factors = Array.isArray(source.factors) ? source.factors.map(normalizeFactor).filter(Boolean) : [];

    return {
      capacity: clampPercent(source.capacity, DEFAULT_CAPACITY_OUTPUT.capacity),
      status: typeof source.status === "string" && source.status.trim()
        ? source.status.trim()
        : DEFAULT_CAPACITY_OUTPUT.status,
      factors
    };
  }

  function normalizeDailyContext(input) {
    const source = input && typeof input === "object" ? input : {};

    return {
      timeOfDay: typeof source.timeOfDay === "string" && source.timeOfDay.trim()
        ? source.timeOfDay.toLowerCase()
        : MOCK_DAILY_CONTEXT.timeOfDay,
      weekday: Number.isFinite(Number(source.weekday)) ? Math.round(Number(source.weekday)) : MOCK_DAILY_CONTEXT.weekday,
      recentCompletionRate: clampPercent(source.recentCompletionRate, MOCK_DAILY_CONTEXT.recentCompletionRate),
      streakDays: Number.isFinite(Number(source.streakDays))
        ? Math.max(0, Math.round(Number(source.streakDays)))
        : MOCK_DAILY_CONTEXT.streakDays,
      category: typeof source.category === "string" ? source.category.trim() : "",
      note: typeof source.note === "string" ? source.note.trim() : ""
    };
  }

  function getContextText(dailyContext) {
    return [dailyContext.category, dailyContext.note]
      .map(function (value) {
        return typeof value === "string" ? value.trim().toLowerCase() : "";
      })
      .filter(Boolean)
      .join(" ");
  }

  function normalizeStructuredContextInput(input) {
    const source = input && typeof input === "object" ? input : {};

    const physical = source.physical && typeof source.physical === "object" ? source.physical : {};
    const work = source.work && typeof source.work === "object" ? source.work : {};
    const mental = source.mental && typeof source.mental === "object" ? source.mental : {};

    return {
      physical: {
        pain: Boolean(physical.pain),
        painAreas: Array.isArray(physical.painAreas)
          ? physical.painAreas.filter(function (area) { return typeof area === "string" && area.trim(); })
          : [],
        fatigue: Boolean(physical.fatigue),
        headache: Boolean(physical.headache),
        coldSymptoms: Boolean(physical.coldSymptoms)
      },
      work: {
        workload: typeof work.workload === "string" && work.workload.trim()
          ? work.workload.trim().toLowerCase()
          : "normal",
        importantEvent: Boolean(work.importantEvent),
        eventType: typeof work.eventType === "string" && work.eventType.trim()
          ? work.eventType.trim().toLowerCase()
          : "none",
        overtimeRisk: Boolean(work.overtimeRisk),
        businessTrip: Boolean(work.businessTrip),
        deadlineRisk: Boolean(work.deadlineRisk)
      },
      mental: {
        stressRisk: typeof mental.stressRisk === "string" && mental.stressRisk.trim()
          ? mental.stressRisk.trim().toLowerCase()
          : "low",
        motivation: typeof mental.motivation === "string" && mental.motivation.trim()
          ? mental.motivation.trim().toLowerCase()
          : "unknown",
        stressed: Boolean(mental.stressed),
        anxious: Boolean(mental.anxious),
        calm: Boolean(mental.calm)
      },
      constraints: Array.isArray(source.constraints)
        ? source.constraints.filter(function (item) { return typeof item === "string" && item.trim(); })
        : [],
      priorities: Array.isArray(source.priorities)
        ? source.priorities.filter(function (item) { return typeof item === "string" && item.trim(); })
        : []
    };
  }

  function resolveStructuredContext(dailyContextInput, normalizedDailyContext) {
    const input = dailyContextInput && typeof dailyContextInput === "object" ? dailyContextInput : null;
    const hasEmbeddedStructuredContext = input
      && input.structuredContext
      && typeof input.structuredContext === "object";
    const looksLikeStructuredContext = input
      && (input.physical || input.work || input.mental || input.constraints || input.priorities);

    if (hasEmbeddedStructuredContext) {
      return normalizeStructuredContextInput(input.structuredContext);
    }

    if (looksLikeStructuredContext) {
      return normalizeStructuredContextInput(input);
    }

    if (contextUnderstanding && typeof contextUnderstanding.analyzeContext === "function") {
      return normalizeStructuredContextInput(contextUnderstanding.analyzeContext(normalizedDailyContext));
    }

    return null;
  }

  function getPriorityBoostsFromStructuredContext(structuredContext) {
    if (!structuredContext || typeof structuredContext !== "object") {
      return null;
    }

    const boosts = {};

    function addBoost(recommendationId, amount) {
      boosts[recommendationId] = (boosts[recommendationId] || 0) + amount;
    }

    const physical = structuredContext.physical || {};
    const work = structuredContext.work || {};
    const mental = structuredContext.mental || {};
    const constraints = Array.isArray(structuredContext.constraints) ? structuredContext.constraints : [];
    const priorities = Array.isArray(structuredContext.priorities) ? structuredContext.priorities : [];

    if (physical.pain || physical.fatigue || physical.headache || physical.coldSymptoms) {
      addBoost("protect_recovery", 4);
      addBoost("trim_workload", 2);
    }

    if (work.overtimeRisk || work.workload === "high") {
      addBoost("trim_workload", 5);
      addBoost("protect_recovery", 2);
    }

    if (work.importantEvent || work.deadlineRisk || work.eventType === "presentation") {
      addBoost("reduce_stress_load", 4);
      addBoost("protect_recovery", 1);
    }

    if (work.businessTrip) {
      addBoost("trim_workload", 2);
      addBoost("protect_recovery", 1);
    }

    if (mental.stressRisk === "high") {
      addBoost("reduce_stress_load", 4);
      addBoost("protect_recovery", 1);
    } else if (mental.stressRisk === "medium") {
      addBoost("reduce_stress_load", 3);
    }

    if (constraints.indexOf("avoid_high_intensity_activity") >= 0) {
      addBoost("protect_recovery", 3);
      addBoost("trim_workload", 1);
    }

    if (priorities.indexOf("focus_protection") >= 0) {
      addBoost("reduce_stress_load", 3);
      addBoost("protect_recovery", 1);
    }

    if (priorities.indexOf("recovery_support") >= 0) {
      addBoost("protect_recovery", 2);
      addBoost("trim_workload", 2);
    }

    return Object.keys(boosts).length ? boosts : null;
  }

  function getPriorityBoostsFromRawDailyContext(dailyContext) {
    const text = getContextText(dailyContext);

    if (!text) {
      return null;
    }

    const boosts = {};

    function addBoost(recommendationId, amount) {
      boosts[recommendationId] = (boosts[recommendationId] || 0) + amount;
    }

    if (/(hurt|hurts|injury|injured|pain|sore|soreness|ankle|knee|back|recovery)/i.test(text)
      || /physical/i.test(dailyContext.category)) {
      addBoost("protect_recovery", 4);
      addBoost("trim_workload", 3);
      addBoost("reduce_stress_load", 1);
    }

    if (/(presentation|exam|deadline|interview|focus|concentrat|stress|anxious|nervous|sleep)/i.test(text)
      || /mental/i.test(dailyContext.category)) {
      addBoost("reduce_stress_load", 4);
      addBoost("protect_recovery", 2);
      addBoost("trim_workload", 1);
    }

    if (/(working late|late tonight|overtime|long day|extended hours|night shift|busy night)/i.test(text)
      || /work/i.test(dailyContext.category)) {
      addBoost("trim_workload", 5);
      addBoost("protect_recovery", 2);
      addBoost("reduce_stress_load", 1);
    }

    return Object.keys(boosts).length ? boosts : null;
  }

  function applyDailyContextPriority(recommendations, dailyContext, structuredContext) {
    const boosts = getPriorityBoostsFromStructuredContext(structuredContext)
      || getPriorityBoostsFromRawDailyContext(dailyContext);

    if (!boosts) {
      return recommendations;
    }

    return recommendations
      .map(function (recommendation, index) {
        const boost = boosts[recommendation.id] || 0;

        return {
          recommendation,
          index,
          score: boost
        };
      })
      .sort(function (left, right) {
        if (left.score !== right.score) {
          return right.score - left.score;
        }

        if (left.recommendation.priority !== right.recommendation.priority) {
          return left.recommendation.priority - right.recommendation.priority;
        }

        if (left.recommendation.id !== right.recommendation.id) {
          return left.recommendation.id.localeCompare(right.recommendation.id);
        }

        return left.index - right.index;
      })
      .map(function (entry, index) {
        return createRecommendation(
          entry.recommendation.id,
          index + 1,
          entry.recommendation.objective,
          entry.recommendation.reason
        );
      });
  }

  function getFactorImpact(factors, factorName) {
    const target = String(factorName || "").toLowerCase();

    for (const factor of factors) {
      if (String(factor.name || "").toLowerCase() === target) {
        return factor.impact;
      }
    }

    return 0;
  }

  function hasNegativeImpact(factors, factorName, threshold) {
    return getFactorImpact(factors, factorName) <= threshold;
  }

  function createRecommendation(id, priority, objective, reason) {
    return {
      id,
      priority,
      objective,
      reason
    };
  }

  function generateRecommendations(capacityOutput, dailyContextInput) {
    const capacityState = normalizeCapacityOutput(capacityOutput);
    const dailyContext = normalizeDailyContext(dailyContextInput);
    const structuredContext = resolveStructuredContext(dailyContextInput, dailyContext);
    const factors = capacityState.factors;

    const recommendations = [];

    if (capacityState.capacity <= 45 || /recovery first|take it easy/i.test(capacityState.status)) {
      const hasWorkloadRisk = hasNegativeImpact(factors, "Workload", -3);

      recommendations.push(createRecommendation(
        "protect_recovery",
        1,
        "Prioritize recovery",
        hasWorkloadRisk
          ? "Capacity is low and workload is high."
          : "Capacity is low and recovery reserve is limited."
      ));
    }

    if (hasNegativeImpact(factors, "Stress", -3)) {
      recommendations.push(createRecommendation(
        "reduce_stress_load",
        2,
        "Reduce stress load",
        "Stress impact is reducing available capacity today."
      ));
    }

    if (hasNegativeImpact(factors, "Workload", -3) && capacityState.capacity <= 65) {
      recommendations.push(createRecommendation(
        "trim_workload",
        3,
        "Trim workload intensity",
        "Workload pressure is high relative to current capacity."
      ));
    }

    if (recommendations.length < MAX_RECOMMENDATIONS
      && dailyContext.recentCompletionRate >= 65
      && dailyContext.streakDays >= 3
      && capacityState.capacity >= 55) {
      recommendations.push(createRecommendation(
        "protect_consistency",
        4,
        "Protect consistency",
        "Completion momentum is strong and worth preserving today."
      ));
    }

    if (recommendations.length < MAX_RECOMMENDATIONS
      && !recommendations.length
      && capacityState.capacity >= 60) {
      recommendations.push(createRecommendation(
        "maintain_balance",
        5,
        "Maintain balanced effort",
        "Capacity is stable, so a balanced pace is the best objective."
      ));
    }

    const sortedRecommendations = recommendations
      .sort(function (left, right) {
        if (left.priority !== right.priority) {
          return left.priority - right.priority;
        }

        return left.id.localeCompare(right.id);
      })
      .slice(0, MAX_RECOMMENDATIONS);

    return applyDailyContextPriority(sortedRecommendations, dailyContext, structuredContext);
  }

  return {
    MAX_RECOMMENDATIONS,
    MOCK_DAILY_CONTEXT,
    normalizeCapacityOutput,
    normalizeDailyContext,
    generateRecommendations,
    createRecommendations: generateRecommendations
  };
});

console.log("Recommendation Engine loaded");