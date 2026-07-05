// ======================================
// Health Pilot
// Health Insights Foundation v1
// ======================================

(function (root, factory) {
  const insightsEngine = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = insightsEngine;
  }

  root.HealthInsights = insightsEngine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  // Keep thresholds centralized so the future Rule Engine can tune behavior safely.
  const DEFAULT_INSIGHT_THRESHOLDS = {
    sleepDebtMax: 60,
    sleepDebtHighSeverityMax: 45,
    recoveryLowMax: 55,
    recoveryLowHighSeverityMax: 40,
    stressHighMin: 70,
    stressHighHighSeverityMin: 85,
    activityLowMax: 50,
    activityLowHighSeverityMax: 35,
    energyLowMax: 55,
    energyLowHighSeverityMax: 40,
    balancedSleepMin: 65,
    balancedRecoveryMin: 60,
    balancedStressMax: 50,
    balancedActivityMin: 60,
    balancedMoodMin: 60,
    balancedFocusMin: 60
  };

  const SEVERITY_ORDER = {
    high: 3,
    medium: 2,
    low: 1
  };

  function clampScore(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(100, Math.max(0, Math.round(number)));
  }

  function normalizeSignalInput(input) {
    const source = input && typeof input === "object"
      ? (input.signals && typeof input.signals === "object" ? input.signals : input)
      : {};

    return {
      sleepScore: clampScore(source.sleepScore, 80),
      recoveryScore: clampScore(source.recoveryScore, 75),
      stressLevel: clampScore(source.stressLevel, 35),
      activityScore: clampScore(source.activityScore, 65),
      moodScore: clampScore(source.moodScore, 70),
      focusLevel: clampScore(source.focusLevel, 68),
      hydrationScore: source.hydrationScore == null ? null : clampScore(source.hydrationScore, null)
    };
  }

  function buildInsight(id, label, severity, reason, relatedSignals) {
    return {
      id,
      label,
      severity,
      reason,
      relatedSignals
    };
  }

  function getEnergyProxy(signals) {
    return Math.round((signals.recoveryScore + signals.moodScore + signals.focusLevel) / 3);
  }

  function sortInsights(insights) {
    return insights.slice().sort(function (left, right) {
      const severityDiff = (SEVERITY_ORDER[right.severity] || 0) - (SEVERITY_ORDER[left.severity] || 0);

      if (severityDiff !== 0) {
        return severityDiff;
      }

      return left.id.localeCompare(right.id);
    });
  }

  function generateHealthInsights(input, thresholdOverrides) {
    const signals = normalizeSignalInput(input);
    const thresholds = Object.assign({}, DEFAULT_INSIGHT_THRESHOLDS, thresholdOverrides || {});
    const insights = [];

    if (signals.sleepScore <= thresholds.sleepDebtMax) {
      const severity = signals.sleepScore <= thresholds.sleepDebtHighSeverityMax ? "high" : "medium";
      insights.push(buildInsight(
        "sleep_debt",
        "Sleep debt",
        severity,
        `Sleep score is ${signals.sleepScore}, below the ${thresholds.sleepDebtMax} target range.`,
        ["sleepScore"]
      ));
    }

    if (signals.recoveryScore <= thresholds.recoveryLowMax) {
      const severity = signals.recoveryScore <= thresholds.recoveryLowHighSeverityMax ? "high" : "medium";
      insights.push(buildInsight(
        "recovery_low",
        "Recovery is low",
        severity,
        `Recovery score is ${signals.recoveryScore}, signaling incomplete recovery readiness.`,
        ["recoveryScore"]
      ));
    }

    if (signals.stressLevel >= thresholds.stressHighMin) {
      const severity = signals.stressLevel >= thresholds.stressHighHighSeverityMin ? "high" : "medium";
      insights.push(buildInsight(
        "stress_high",
        "Stress is elevated",
        severity,
        `Stress level is ${signals.stressLevel}, above the ${thresholds.stressHighMin} high-stress threshold.`,
        ["stressLevel"]
      ));
    }

    const energyProxy = getEnergyProxy(signals);
    if (energyProxy <= thresholds.energyLowMax) {
      const severity = energyProxy <= thresholds.energyLowHighSeverityMax ? "high" : "medium";
      insights.push(buildInsight(
        "energy_low",
        "Energy is low",
        severity,
        `Energy proxy is ${energyProxy}, based on recovery, mood, and focus trends.`,
        ["recoveryScore", "moodScore", "focusLevel"]
      ));
    }

    if (signals.activityScore <= thresholds.activityLowMax) {
      const severity = signals.activityScore <= thresholds.activityLowHighSeverityMax ? "high" : "medium";
      insights.push(buildInsight(
        "activity_low",
        "Activity is below baseline",
        severity,
        `Activity score is ${signals.activityScore}, below the ${thresholds.activityLowMax} activity baseline.`,
        ["activityScore"]
      ));
    }

    const isBalanced = insights.length === 0
      && signals.sleepScore >= thresholds.balancedSleepMin
      && signals.recoveryScore >= thresholds.balancedRecoveryMin
      && signals.stressLevel <= thresholds.balancedStressMax
      && signals.activityScore >= thresholds.balancedActivityMin
      && signals.moodScore >= thresholds.balancedMoodMin
      && signals.focusLevel >= thresholds.balancedFocusMin;

    if (isBalanced) {
      insights.push(buildInsight(
        "balanced_day",
        "Balanced day",
        "low",
        "Core health signals are in a stable range across sleep, recovery, stress, activity, mood, and focus.",
        ["sleepScore", "recoveryScore", "stressLevel", "activityScore", "moodScore", "focusLevel"]
      ));
    }

    return sortInsights(insights);
  }

  return {
    DEFAULT_INSIGHT_THRESHOLDS,
    generateHealthInsights
  };
});

console.log("Health Insights loaded");