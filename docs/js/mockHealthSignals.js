// ======================================
// Health Pilot
// Mock Health Signals v1
// ======================================

(function () {
  function getCreateHealthSignals() {
    if (window.HealthSignals && typeof window.HealthSignals.createHealthSignals === "function") {
      return window.HealthSignals.createHealthSignals;
    }

    if (typeof require === "function") {
      try {
        const healthSignalsModule = require("./healthSignals.js");
        if (healthSignalsModule && typeof healthSignalsModule.createHealthSignals === "function") {
          return healthSignalsModule.createHealthSignals;
        }
      } catch (error) {
        // Keep fallback simple for local-only mock usage.
      }
    }

    return function passthrough(data) {
      return data;
    };
  }

  const createHealthSignals = getCreateHealthSignals();

  const MOCK_HEALTH_SIGNALS_DAILY = [
    createHealthSignals({
      date: "2026-07-05",
      profileId: "local-user",
      signals: {
        sleepScore: 58,      // Moderate sleep quality after short sleep duration.
        recoveryScore: 44,   // Low recovery readiness due to accumulated fatigue.
        stressLevel: 74,     // Elevated stress burden requiring regulation support.
        activityScore: 62,   // Light-to-moderate daily movement achieved.
        moodScore: 66,       // Slightly positive mood but not fully stable.
        focusLevel: 52,      // Reduced concentration capacity this morning.
        hydrationScore: 61   // Hydration is present but below ideal range.
      },
      context: {
        timeOfDay: "morning",
        weekday: 0,
        recentCompletionRate: 67,
        streakDays: 3
      }
    }),
    createHealthSignals({
      date: "2026-07-06",
      profileId: "local-user",
      signals: {
        sleepScore: 72,      // Better sleep depth and duration than previous day.
        recoveryScore: 68,   // Recovery has improved with lighter prior workload.
        stressLevel: 48,     // Moderate stress level, currently manageable.
        activityScore: 70,   // Healthy activity baseline maintained today.
        moodScore: 73,       // Positive emotional state supports consistency.
        focusLevel: 76,      // Strong focus window for cognitively heavy tasks.
        hydrationScore: null // Hydration signal intentionally missing in v1 path.
      },
      context: {
        timeOfDay: "afternoon",
        weekday: 1,
        recentCompletionRate: 71,
        streakDays: 4
      }
    })
  ];

  function getMockHealthSignalsByDate(date) {
    return MOCK_HEALTH_SIGNALS_DAILY.find((entry) => entry.date === date) || null;
  }

  window.MockHealthSignals = {
    MOCK_HEALTH_SIGNALS_DAILY,
    getMockHealthSignalsByDate
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      MOCK_HEALTH_SIGNALS_DAILY,
      getMockHealthSignalsByDate
    };
  }

  console.log("Mock Health Signals loaded");
})();
