export const mockAiOutput = {
  aiBriefing: {
    title: "Good morning",
    body: "今日は昨日より少し回復しています。\n\nまずはこの3つだけ意識しましょう。",
  },
  todayCapacity: 72,
  tomorrowCapacity: {
    baseline: 67,
    withMissions: 74,
    delta: 7,
    confidence: "Medium",
    reason:
      "睡眠時間はやや短めです。軽い運動と早めの就寝で、明日の回復と集中力の改善が期待できます。",
  },
  missions: [
    {
      title: "23:00までに就寝",
      expectedImpact: 4,
      confidence: "High",
      why: "睡眠時間を確保することで、明日の回復と集中力が上がる可能性があります。",
    },
    {
      title: "夕食後に10分歩く",
      expectedImpact: 2,
      confidence: "Medium",
      why: "軽い活動は血流と気分を整え、翌日のコンディションに良い影響を与える可能性があります。",
    },
    {
      title: "15時以降カフェインなし",
      expectedImpact: 1,
      confidence: "Medium",
      why: "睡眠の質を守ることで、明日のCapacity低下を防げる可能性があります。",
    },
  ],
  discovery: {
    title: "昼食後に5分だけ外へ出る",
    why: "短時間の外気と光が、午後の眠気や集中力にどう影響するかを学習するための小さな実験です。",
  },
  reflection: {
    title: "昨日のMissionが今日に与えた影響",
    summary:
      "昨日のウォーキングとカフェイン制限は、今朝の集中力の維持に役立った可能性があります。一方で睡眠時間は短めでした。今日は早めに休むことを意識しましょう。",
  },
};