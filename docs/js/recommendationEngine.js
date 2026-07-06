// ======================================
// Health Pilot
// Recommendation Engine v1
// ======================================

(function (root, factory) {
  const engine = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = engine;
  }

  root.RecommendationEngine = engine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const MAX_RECOMMENDATIONS = 3;

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

  function getPriorityBoostsFromDailyContext(dailyContext) {
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

  function applyDailyContextPriority(recommendations, dailyContext) {
    const boosts = getPriorityBoostsFromDailyContext(dailyContext);

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

    return applyDailyContextPriority(sortedRecommendations, dailyContext);
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