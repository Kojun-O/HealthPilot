// ======================================
// Health Pilot
// Prediction Engine v1
// ======================================

(function (root, factory) {
  const engine = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = engine;
  }

  root.PredictionEngine = engine;
})(typeof window !== "undefined" ? window : globalThis, function () {
  const MIN_CAPACITY = 0;
  const MAX_CAPACITY = 100;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toCapacityValue(value) {
    const numeric = Number(value);

    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return clamp(Math.round(numeric), MIN_CAPACITY, MAX_CAPACITY);
  }

  function normalizeMission(mission) {
    if (!mission || typeof mission !== "object") {
      return null;
    }

    const id = typeof mission.id === "string" ? mission.id.trim() : "";
    const impact = Number(mission.impact);

    if (!id || !Number.isFinite(impact)) {
      return null;
    }

    return {
      id,
      impact: clamp(Math.round(impact), 0, 10),
      completed: Boolean(mission.completed)
    };
  }

  function normalizeMissions(input) {
    return Array.isArray(input)
      ? input.map(normalizeMission).filter(Boolean)
      : [];
  }

  function normalizeMissionCompletion(input, missions) {
    const source = input && typeof input === "object" ? input : {};
    const completedMissionIds = Array.isArray(source.completedMissionIds)
      ? source.completedMissionIds.filter(function (id) { return typeof id === "string" && id.trim(); }).map(function (id) { return id.trim(); })
      : null;
    const completionRate = Number(source.completionRate);
    const completedCount = Number(source.completedCount);
    const totalCount = Number(source.totalCount);

    if (completedMissionIds && completedMissionIds.length) {
      return {
        mode: "ids",
        completedMissionIds: new Set(completedMissionIds)
      };
    }

    if (Number.isFinite(completionRate)) {
      return {
        mode: "rate",
        completionRate: clamp(completionRate, 0, 1)
      };
    }

    if (Number.isFinite(completedCount) && Number.isFinite(totalCount) && totalCount > 0) {
      return {
        mode: "rate",
        completionRate: clamp(completedCount / totalCount, 0, 1)
      };
    }

    const completedFromMissionFlags = missions.filter(function (mission) {
      return mission.completed;
    }).length;

    if (missions.length > 0 && completedFromMissionFlags > 0) {
      return {
        mode: "rate",
        completionRate: clamp(completedFromMissionFlags / missions.length, 0, 1)
      };
    }

    return {
      mode: "rate",
      completionRate: 0
    };
  }

  function resolveCompletedImpact(missions, completion) {
    const totalImpact = missions.reduce(function (sum, mission) {
      return sum + mission.impact;
    }, 0);

    if (completion.mode === "ids") {
      const completedImpact = missions.reduce(function (sum, mission) {
        return completion.completedMissionIds.has(mission.id) ? sum + mission.impact : sum;
      }, 0);

      return {
        totalImpact,
        completedImpact
      };
    }

    return {
      totalImpact,
      completedImpact: totalImpact * completion.completionRate
    };
  }

  function calculateTomorrowCapacity(input) {
    const source = input && typeof input === "object" ? input : {};
    const currentCapacity = toCapacityValue(
      source.currentCapacity
      ?? (source.capacity && (source.capacity.score ?? source.capacity.capacity))
    );
    const missions = normalizeMissions(source.missions);
    const completion = normalizeMissionCompletion(source.missionCompletion, missions);
    const impact = resolveCompletedImpact(missions, completion);
    const projectedDelta = clamp(Math.round(impact.completedImpact), -20, 20);
    const projectedCapacity = clamp(currentCapacity + projectedDelta, MIN_CAPACITY, MAX_CAPACITY);

    return {
      currentCapacity,
      projectedCapacity,
      projectedDelta,
      missionImpact: {
        totalImpact: impact.totalImpact,
        completedImpact: Math.round(impact.completedImpact)
      }
    };
  }

  return {
    calculateTomorrowCapacity,
    calculatePrediction: calculateTomorrowCapacity
  };
});

console.log("Prediction Engine loaded");