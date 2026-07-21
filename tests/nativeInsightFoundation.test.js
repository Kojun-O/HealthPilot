const test = require("node:test");
const assert = require("node:assert/strict");

async function loadModules() {
  const [{ pickMainSleep }, { normalizeHealthData }, { generateInsights }] = await Promise.all([
    import("../native/HealthPilotExpo/src/health/mainSleep.js"),
    import("../native/HealthPilotExpo/src/ai/normalizeHealthData.js"),
    import("../native/HealthPilotExpo/src/ai/insights/generateInsights.js"),
  ]);

  return {
    pickMainSleep,
    normalizeHealthData,
    generateInsights,
  };
}

test("mainSleep keeps an overnight session across midnight as 480 minutes", async () => {
  const { pickMainSleep } = await loadModules();

  const mainSleep = pickMainSleep([
    {
      start: "2026-07-19T22:00:00+09:00",
      end: "2026-07-20T06:00:00+09:00",
    },
  ]);

  assert.equal(mainSleep.durationMinutes, 480);
  assert.equal(mainSleep.startAt, "2026-07-19T13:00:00.000Z");
  assert.equal(mainSleep.endAt, "2026-07-19T21:00:00.000Z");
});

test("generateInsights returns short_main_sleep with moderate severity at 390 minutes", async () => {
  const { generateInsights } = await loadModules();

  const insights = generateInsights({
    sleep: {
      mainSleep: {
        startAt: "2026-07-19T13:30:00.000Z",
        endAt: "2026-07-19T20:00:00.000Z",
        durationMinutes: 390,
      },
    },
  });

  assert.deepEqual(insights, [
    {
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity: "moderate",
      evidence: {
        durationMinutes: 390,
        thresholdMinutes: 420,
      },
    },
  ]);
});

test("generateInsights returns low_activity at 4999 steps with moderate severity", async () => {
  const { generateInsights } = await loadModules();

  const insights = generateInsights({
    activity: {
      steps: 4999,
    },
  });

  assert.deepEqual(insights, [
    {
      id: "low_activity",
      type: "low_activity",
      severity: "moderate",
      evidence: {
        stepCount: 4999,
        thresholdSteps: 5000,
      },
    },
  ]);
});

test("generateInsights does not return low_activity at exactly 5000 steps", async () => {
  const { generateInsights } = await loadModules();

  const insights = generateInsights({
    activity: {
      steps: 5000,
    },
  });

  assert.deepEqual(insights, []);
});

test("generateInsights returns low_activity for 0 steps", async () => {
  const { generateInsights } = await loadModules();

  const insights = generateInsights({
    activity: {
      steps: 0,
    },
  });

  assert.deepEqual(insights, [
    {
      id: "low_activity",
      type: "low_activity",
      severity: "moderate",
      evidence: {
        stepCount: 0,
        thresholdSteps: 5000,
      },
    },
  ]);
});

test("generateInsights does not return low_activity for null or undefined steps", async () => {
  const { generateInsights } = await loadModules();

  assert.deepEqual(
    generateInsights({
      activity: {
        steps: null,
      },
    }),
    [],
  );
  assert.deepEqual(
    generateInsights({
      activity: {
        steps: undefined,
      },
    }),
    [],
  );
});

test("generateInsights does not return low_activity for invalid step values", async () => {
  const { generateInsights } = await loadModules();

  assert.deepEqual(
    generateInsights({
      activity: {
        steps: Number.NaN,
      },
    }),
    [],
  );
  assert.deepEqual(
    generateInsights({
      activity: {
        steps: "3000",
      },
    }),
    [],
  );
  assert.deepEqual(
    generateInsights({
      activity: {
        steps: -1,
      },
    }),
    [],
  );
});

test("generateInsights returns short_main_sleep with high severity at 350 minutes", async () => {
  const { generateInsights } = await loadModules();

  const insights = generateInsights({
    sleep: {
      mainSleep: {
        startAt: "2026-07-19T14:10:00.000Z",
        endAt: "2026-07-19T20:00:00.000Z",
        durationMinutes: 350,
      },
    },
  });

  assert.equal(insights.length, 1);
  assert.equal(insights[0].type, "short_main_sleep");
  assert.equal(insights[0].severity, "high");
});

test("generateInsights does not create a sleep insight at 450 minutes", async () => {
  const { generateInsights } = await loadModules();

  const insights = generateInsights({
    sleep: {
      mainSleep: {
        startAt: "2026-07-19T12:30:00.000Z",
        endAt: "2026-07-19T20:00:00.000Z",
        durationMinutes: 450,
      },
    },
  });

  assert.deepEqual(insights, []);
});

test("generateInsights returns short_main_sleep and low_activity together", async () => {
  const { generateInsights } = await loadModules();

  const insights = generateInsights({
    sleep: {
      mainSleep: {
        durationMinutes: 390,
      },
    },
    activity: {
      steps: 3000,
    },
  });

  assert.deepEqual(insights, [
    {
      id: "short_main_sleep",
      type: "short_main_sleep",
      severity: "moderate",
      evidence: {
        durationMinutes: 390,
        thresholdMinutes: 420,
      },
    },
    {
      id: "low_activity",
      type: "low_activity",
      severity: "moderate",
      evidence: {
        stepCount: 3000,
        thresholdSteps: 5000,
      },
    },
  ]);
});

test("null mainSleep stays safe through normalization and insight generation", async () => {
  const { normalizeHealthData, generateInsights } = await loadModules();

  const normalizedHealthData = normalizeHealthData({
    mainSleep: null,
    hrv: null,
    restingHeartRate: null,
    steps: null,
  });

  assert.equal(normalizedHealthData.sleep.mainSleep, null);
  assert.equal(normalizedHealthData.sleep.score, null);
  assert.deepEqual(generateInsights(normalizedHealthData), []);
});

test("normalizeHealthData returns the new shape without NaN values", async () => {
  const { normalizeHealthData } = await loadModules();

  const normalizedHealthData = normalizeHealthData({
    mainSleep: {
      startAt: "2026-07-19T13:30:00.000Z",
      endAt: "2026-07-19T20:00:00.000Z",
      durationMinutes: Number.NaN,
    },
    hrv: Number.NaN,
    restingHeartRate: Number.POSITIVE_INFINITY,
    steps: Number.NaN,
  });

  assert.deepEqual(normalizedHealthData.sleep, {
    mainSleep: {
      startAt: "2026-07-19T13:30:00.000Z",
      endAt: "2026-07-19T20:00:00.000Z",
      durationMinutes: null,
    },
    score: null,
  });
  assert.deepEqual(normalizedHealthData.recovery, {
    hrvMs: null,
    restingHeartRateBpm: null,
  });
  assert.deepEqual(normalizedHealthData.activity, {
    steps: null,
  });
  assert.equal(typeof normalizedHealthData.metadata.generatedAt, "string");
  assert.equal(Number.isNaN(normalizedHealthData.sleep.score), false);
});