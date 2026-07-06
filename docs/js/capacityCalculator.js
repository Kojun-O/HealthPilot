// ======================================
// Health Pilot
// Capacity Calculator v1
// ======================================

(function (root, factory) {
  const calculator = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = calculator;
  }

  root.CapacityCalculator = calculator;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const STATUS_BANDS = [
    { min: 90, status: "Excellent" },
    { min: 75, status: "Ready" },
    { min: 60, status: "Balanced" },
    { min: 40, status: "Take it easy" },
    { min: 0, status: "Recovery first" }
  ];

  const DEFAULT_INPUT = {
    sleepScore: 70,
    recoveryScore: 70,
    activityScore: 60,
    stressScore: 40,
    workloadLevel: 45,
    painLevel: 25
  };

  function clampScore(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.min(100, Math.max(0, Math.round(number)));
  }

  function normalizeInput(input) {
    const source = input && typeof input === "object" ? input : {};

    return {
      sleepScore: clampScore(source.sleepScore, DEFAULT_INPUT.sleepScore),
      recoveryScore: clampScore(source.recoveryScore, DEFAULT_INPUT.recoveryScore),
      activityScore: clampScore(source.activityScore, DEFAULT_INPUT.activityScore),
      stressScore: clampScore(source.stressScore, DEFAULT_INPUT.stressScore),
      workloadLevel: clampScore(source.workloadLevel, DEFAULT_INPUT.workloadLevel),
      painLevel: clampScore(source.painLevel, DEFAULT_INPUT.painLevel)
    };
  }

  function calculateImpact(signal, weight, invert) {
    const normalized = invert ? 100 - signal : signal;
    return Math.round(((normalized - 50) / 50) * weight);
  }

  function buildFactors(signals) {
    const factors = [
      { name: "Sleep", impact: calculateImpact(signals.sleepScore, 12, false) },
      { name: "Recovery", impact: calculateImpact(signals.recoveryScore, 12, false) },
      { name: "Activity", impact: calculateImpact(signals.activityScore, 10, false) },
      { name: "Stress", impact: calculateImpact(signals.stressScore, 14, true) },
      { name: "Workload", impact: calculateImpact(signals.workloadLevel, 10, true) },
      { name: "Pain", impact: calculateImpact(signals.painLevel, 8, true) }
    ];

    return factors
      .filter((factor) => factor.impact !== 0)
      .sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact) || left.name.localeCompare(right.name))
      .slice(0, 4);
  }

  function getStatus(capacity) {
    for (const band of STATUS_BANDS) {
      if (capacity >= band.min) {
        return band.status;
      }
    }

    return "Recovery first";
  }

  function calculateCapacity(input) {
    const signals = normalizeInput(input);
    const score = Math.round(
      50
      + (signals.sleepScore - 50) * 0.25
      + (signals.recoveryScore - 50) * 0.25
      + (signals.activityScore - 50) * 0.15
      - (signals.stressScore - 50) * 0.15
      - (signals.workloadLevel - 50) * 0.10
      - (signals.painLevel - 50) * 0.10
    );
    const capacity = Math.min(100, Math.max(0, score));

    return {
      capacity,
      status: getStatus(capacity),
      factors: buildFactors(signals)
    };
  }

  return {
    calculateCapacity
  };
});

console.log("Capacity Calculator loaded");