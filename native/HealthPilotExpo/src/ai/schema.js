export const insightSchema = {
  todayCapacity: 0,

  tomorrowCapacity: {
    baseline: 0,
    withMissions: 0,
    delta: 0,
    confidence: "",
    reason: "",
  },

  missions: [
    {
      title: "",
      why: "",
      expectedImpact: 0,
      confidence: "",
    },
  ],

  discovery: {
    title: "",
    why: "",
  },
};