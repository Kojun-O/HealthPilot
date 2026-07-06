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
    streakDays: 3
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
        : MOCK_DAILY_CONTEXT.streakDays
    };
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

    return recommendations
      .sort(function (left, right) {
        if (left.priority !== right.priority) {
          return left.priority - right.priority;
        }

        return left.id.localeCompare(right.id);
      })
      .slice(0, MAX_RECOMMENDATIONS);
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