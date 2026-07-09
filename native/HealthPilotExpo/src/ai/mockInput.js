import { loadAppleHealthSnapshot } from "../health/appleHealth";

export const mockAiInput = {
  date: "2026-07-08",

  health: {
    sleepHours: null,
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
  const healthSnapshot = await loadAppleHealthSnapshot();

  return {
    input: {
      ...mockAiInput,
      date: new Date().toISOString().slice(0, 10),
      health: healthSnapshot.health,
    },
    healthSnapshot,
  };
}