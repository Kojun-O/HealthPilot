// ======================================
// Health Pilot
// Context Engine v1
// ======================================

(function (root, factory) {
  const engine = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = engine;
  }

  root.ContextEngine = engine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const DEFAULT_CONTEXT = {
    recovery: "medium",
    stress: "medium",
    sleepDebt: false,
    focusDemand: "medium",
    energy: "medium",
    confidence: 0.7,
    primaryLeverage: "consistency",
    recommendationMode: "balanced"
  };

  function clampPercent(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.max(0, Math.min(100, Math.round(number)));
  }

  function clampUnit(value, fallback) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return fallback;
    }

    return Math.max(0, Math.min(1, number));
  }

  function normalizeTimeOfDay(input) {
    const source = input && typeof input === "object" ? input : {};
    const explicit = typeof source.timeOfDay === "string" ? source.timeOfDay.trim().toLowerCase() : "";

    if (explicit === "morning" || explicit === "afternoon" || explicit === "evening" || explicit === "night") {
      return explicit;
    }

    const hour = Number(source.hour);
    const normalizedHour = Number.isFinite(hour)
      ? Math.max(0, Math.min(23, Math.round(hour)))
      : new Date().getHours();

    if (normalizedHour < 12) return "morning";
    if (normalizedHour < 18) return "afternoon";
    if (normalizedHour < 22) return "evening";
    return "night";
  }

  function normalizeTodayData(todayDataInput) {
    const source = todayDataInput && typeof todayDataInput === "object" ? todayDataInput : {};
    const capacityObject = source.capacity && typeof source.capacity === "object" ? source.capacity : {};
    const dailyContext = source.dailyContext && typeof source.dailyContext === "object" ? source.dailyContext : {};
    const checkIn = source.checkIn && typeof source.checkIn === "object" ? source.checkIn : {};
    const checkInCondition = Number.isFinite(Number(checkIn.condition)) ? Math.round(Number(checkIn.condition)) : null;
    const checkInSleep = Number.isFinite(Number(checkIn.sleep)) ? Math.round(Number(checkIn.sleep)) : null;
    const checkInExercise = Number.isFinite(Number(checkIn.exercise)) ? Math.round(Number(checkIn.exercise)) : null;
    const checkInMood = Number.isFinite(Number(checkIn.mood)) ? Math.round(Number(checkIn.mood)) : null;
    const checkInStress = Number.isFinite(Number(checkIn.stress)) ? Math.round(Number(checkIn.stress)) : null;

    return {
      sleepScore: clampPercent(source.sleepScore, 60),
      recoveryScore: clampPercent(source.recoveryScore, clampPercent(source.conditionScore, 60)),
      stressLevel: clampPercent(source.stressLevel, clampPercent(source.stressScore, 50)),
      energyLevel: clampPercent(source.energyLevel, clampPercent(source.activityScore, 60)),
      capacityScore: clampPercent(
        source.capacityScore,
        clampPercent(
          capacityObject.capacity,
          clampPercent(capacityObject.score, 60)
        )
      ),
      checkInCondition,
      checkInSleep,
      checkInExercise,
      checkInMood,
      checkInStress,
      timeOfDay: normalizeTimeOfDay({
        timeOfDay: dailyContext.timeOfDay ?? source.timeOfDay,
        hour: source.hour
      })
    };
  }

  function average(values) {
    const safeValues = Array.isArray(values)
      ? values
        .filter(function (value) { return Number.isFinite(Number(value)); })
        .map(function (value) { return Number(value); })
      : [];

    if (!safeValues.length) {
      return 0;
    }

    return safeValues.reduce(function (sum, value) {
      return sum + value;
    }, 0) / safeValues.length;
  }

  function deriveRecoveryLevel(signals) {
    const recoveryComposite = average([
      signals.capacityScore,
      signals.recoveryScore,
      Number.isFinite(signals.checkInCondition) ? signals.checkInCondition * 20 : null,
      Number.isFinite(signals.checkInSleep) ? signals.checkInSleep * 20 : null
    ]);

    if (recoveryComposite <= 45) {
      return "low";
    }

    if (recoveryComposite <= 65) {
      return "medium";
    }

    return "high";
  }

  function deriveStressLevel(signals) {
    const stressComposite = Math.max(
      signals.stressLevel,
      Number.isFinite(signals.checkInStress) ? signals.checkInStress * 20 : 0,
      Number.isFinite(signals.checkInMood) ? (5 - signals.checkInMood) * 20 : 0
    );

    if (stressComposite >= 70 || signals.checkInStress >= 4) {
      return "high";
    }

    if (stressComposite >= 50 || signals.checkInStress === 3) {
      return "medium";
    }

    return "low";
  }

  function deriveEnergyLevel(signals) {
    const combined = Math.round(average([
      signals.energyLevel,
      signals.capacityScore,
      Number.isFinite(signals.checkInExercise) ? signals.checkInExercise * 20 : null,
      Number.isFinite(signals.checkInCondition) ? signals.checkInCondition * 20 : null,
      Number.isFinite(signals.checkInMood) ? signals.checkInMood * 20 : null
    ]));

    if (combined <= 45) {
      return "low";
    }

    if (combined <= 65) {
      return "medium";
    }

    return "high";
  }

  function deriveFocusDemand(timeOfDay) {
    if (timeOfDay === "morning") return "medium";
    if (timeOfDay === "afternoon") return "high";
    return "low";
  }

  function derivePrimaryLeverage(context) {
    if (context.sleepDebt) return "sleep";
    if (context.stress === "high") return "stress";
    if (context.energy === "low") return "recovery";
    if (context.focusDemand === "high") return "focus";
    return "consistency";
  }

  function deriveConfidence(signals, context) {
    const availableSignals = [
      signals.sleepScore,
      signals.recoveryScore,
      signals.stressLevel,
      signals.energyLevel,
      signals.capacityScore
    ].filter(function (value) {
      return Number.isFinite(Number(value));
    }).length;

    const base = 0.55 + availableSignals * 0.05;
    const conflictPenalty = context.recovery === "high" && context.energy === "low" ? 0.08 : 0;

    return Number(clampUnit(base - conflictPenalty, DEFAULT_CONTEXT.confidence).toFixed(2));
  }

  function buildContext(todayDataInput) {
    const signals = normalizeTodayData(todayDataInput);
    const sleepDebt = signals.sleepScore <= 55;
    const recovery = deriveRecoveryLevel(signals);
    const stress = deriveStressLevel(signals);
    const energy = deriveEnergyLevel(signals);
    const focusDemand = deriveFocusDemand(signals.timeOfDay);
    const recommendationMode = signals.timeOfDay === "evening" || signals.timeOfDay === "night"
      ? "recovery"
      : "balanced";

    const context = {
      recovery,
      stress,
      sleepDebt,
      focusDemand,
      energy,
      confidence: DEFAULT_CONTEXT.confidence,
      primaryLeverage: DEFAULT_CONTEXT.primaryLeverage,
      recommendationMode
    };

    context.primaryLeverage = derivePrimaryLeverage(context);
    context.confidence = deriveConfidence(signals, context);

    return context;
  }

  return {
    DEFAULT_CONTEXT,
    normalizeTodayData,
    buildContext
  };
});

console.log("Context Engine v1 loaded");
