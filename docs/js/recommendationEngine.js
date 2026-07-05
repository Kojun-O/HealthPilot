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
  const DEFAULT_RECOMMENDATION_THRESHOLDS = {
    maxScore: 100,
    relatedSignalBonus: 4,
    highSeverityBonus: 34,
    mediumSeverityBonus: 20,
    lowSeverityBonus: 10
  };

  const DEFAULT_PRIORITY_RULES = [
    {
      priority: "sleep_priority",
      insightIds: ["sleep_debt"],
      baseScore: 40,
      severityBonus: {
        high: 34,
        medium: 22,
        low: 12
      },
      reasonLead: "Sleep is below target today.",
      order: 1
    },
    {
      priority: "recovery_priority",
      insightIds: ["recovery_low", "energy_low"],
      baseScore: 38,
      severityBonus: {
        high: 32,
        medium: 20,
        low: 10
      },
      reasonLead: "Recovery signals need attention today.",
      order: 2
    },
    {
      priority: "stress_reduction",
      insightIds: ["stress_high"],
      baseScore: 42,
      severityBonus: {
        high: 34,
        medium: 20,
        low: 10
      },
      reasonLead: "Stress is elevated today.",
      order: 3
    },
    {
      priority: "movement_priority",
      insightIds: ["activity_low"],
      baseScore: 36,
      severityBonus: {
        high: 30,
        medium: 18,
        low: 10
      },
      reasonLead: "Movement is below baseline today.",
      order: 4
    },
    {
      priority: "hydration_priority",
      insightIds: ["hydration_low"],
      baseScore: 34,
      severityBonus: {
        high: 28,
        medium: 18,
        low: 8
      },
      reasonLead: "Hydration needs attention today.",
      order: 5
    },
    {
      priority: "balance_priority",
      insightIds: ["balanced_day"],
      baseScore: 24,
      severityBonus: {
        high: 0,
        medium: 0,
        low: 12
      },
      reasonLead: "Core signals are in a stable range.",
      order: 6
    }
  ];

  function clampScore(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(100, Math.max(0, Math.round(number)));
  }

  function normalizeInsight(input) {
    if (!input || typeof input !== "object") {
      return null;
    }

    const id = typeof input.id === "string" ? input.id.trim() : "";

    if (!id) {
      return null;
    }

    return {
      id,
      label: typeof input.label === "string" ? input.label : "",
      severity: typeof input.severity === "string" ? input.severity.toLowerCase() : "low",
      reason: typeof input.reason === "string" ? input.reason : "",
      relatedSignals: Array.isArray(input.relatedSignals) ? input.relatedSignals.slice() : []
    };
  }

  function normalizeHealthInsights(input) {
    const list = Array.isArray(input)
      ? input
      : input && Array.isArray(input.insights)
        ? input.insights
        : [];

    return list.map(normalizeInsight).filter(Boolean);
  }

  function getRuleForInsight(insight, rules) {
    for (const rule of rules) {
      if (rule.insightIds.indexOf(insight.id) !== -1) {
        return rule;
      }
    }

    return null;
  }

  function getSeverityBonus(rule, severity, thresholds) {
    if (rule.severityBonus && Object.prototype.hasOwnProperty.call(rule.severityBonus, severity)) {
      return rule.severityBonus[severity];
    }

    if (severity === "high") {
      return thresholds.highSeverityBonus;
    }

    if (severity === "medium") {
      return thresholds.mediumSeverityBonus;
    }

    return thresholds.lowSeverityBonus;
  }

  function scoreContribution(rule, insight, thresholds) {
    const relatedSignalCount = Array.isArray(insight.relatedSignals) ? insight.relatedSignals.length : 0;

    return rule.baseScore
      + getSeverityBonus(rule, insight.severity, thresholds)
      + relatedSignalCount * thresholds.relatedSignalBonus;
  }

  function createSourceInsight(insight) {
    return {
      id: insight.id,
      label: insight.label,
      severity: insight.severity,
      reason: insight.reason,
      relatedSignals: insight.relatedSignals.slice()
    };
  }

  function buildReason(sourceInsights, fallbackReason) {
    const fragments = [];
    const seen = new Set();

    for (const insight of sourceInsights) {
      if (insight.reason && !seen.has(insight.reason)) {
        fragments.push(insight.reason);
        seen.add(insight.reason);
      }
    }

    if (fragments.length > 0) {
      return fragments.slice(0, 2).join(" ");
    }

    return fallbackReason;
  }

  function buildRecommendation(bucket, thresholds) {
    return {
      id: bucket.priority,
      priority: bucket.priority,
      order: bucket.order,
      score: clampScore(bucket.score, thresholds.maxScore),
      reason: buildReason(bucket.sourceInsights, bucket.fallbackReason),
      sourceInsights: bucket.sourceInsights.map(createSourceInsight)
    };
  }

  function generateRecommendations(input, thresholdOverrides) {
    const healthInsights = normalizeHealthInsights(input);
    const thresholds = Object.assign({}, DEFAULT_RECOMMENDATION_THRESHOLDS, thresholdOverrides || {});
    const priorityRules = DEFAULT_PRIORITY_RULES.map(function (rule) {
      return Object.assign({}, rule);
    });
    const buckets = new Map();

    for (const insight of healthInsights) {
      const rule = getRuleForInsight(insight, priorityRules);

      if (!rule) {
        continue;
      }

      if (!buckets.has(rule.priority)) {
        buckets.set(rule.priority, {
          priority: rule.priority,
          order: rule.order,
          score: 0,
          fallbackReason: rule.reasonLead,
          sourceInsights: []
        });
      }

      const bucket = buckets.get(rule.priority);
      bucket.score += scoreContribution(rule, insight, thresholds);
      bucket.sourceInsights.push(createSourceInsight(insight));
    }

    return Array.from(buckets.values())
      .map(function (bucket) {
        return buildRecommendation(bucket, thresholds);
      })
      .sort(function (left, right) {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        if (left.order !== right.order) {
          return left.order - right.order;
        }

        return left.priority.localeCompare(right.priority);
      })
      .map(function (recommendation) {
        return {
          id: recommendation.id,
          priority: recommendation.priority,
          score: recommendation.score,
          reason: recommendation.reason,
          sourceInsights: recommendation.sourceInsights
        };
      });
  }

  return {
    DEFAULT_RECOMMENDATION_THRESHOLDS,
    DEFAULT_PRIORITY_RULES,
    clampScore,
    normalizeHealthInsights,
    generateRecommendations,
    createRecommendations: generateRecommendations
  };
});

console.log("Recommendation Engine loaded");