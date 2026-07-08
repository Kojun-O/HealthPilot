export const mockAiInput = {
  date: "2026-07-08",

  health: {
    sleepHours: 6.4,
    hrv: 42,
    restingHeartRate: 58,
    steps: 4380,
    workoutMinutes: 0,
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