import { loadHealthData } from "../health/healthDataRepository";
import { generateInsights } from "./insights/generateInsights";
import { normalizeHealthData } from "./normalizeHealthData";

export const mockAiInput = {
  date: "2026-07-08",

  health: {
    mainSleep: {
      startAt: "2026-07-19T13:30:00.000Z",
      endAt: "2026-07-19T20:00:00.000Z",
      durationMinutes: 390,
    },
    hrv: null,
    restingHeartRate: null,
    steps: null,
    weight: null,
  },

  checkIn: {
    energy: 3,
    focus: 3,
    stress: 2,
    mood: 4,
  },

  context: {
    freeText:
      "今日は仕事で少し疲れた。明日は午前中に集中して進めたい作業がある。",
  },

  history: {
    recentEffectiveActions: [
      "23時までに就寝",
      "夕食後に10分歩く",
      "15時以降カフェインなし",
    ],
  },
};

export async function buildAiInput() {
  const healthSnapshot = await loadHealthData();
  const normalizedHealthData = normalizeHealthData(healthSnapshot.health);
  const insights = generateInsights(normalizedHealthData);

  return {
    input: {
      ...mockAiInput,
      date: new Date().toISOString().slice(0, 10),
      health: healthSnapshot.health,
      normalizedHealthData,
      insights,
    },
    healthSnapshot,
  };
}