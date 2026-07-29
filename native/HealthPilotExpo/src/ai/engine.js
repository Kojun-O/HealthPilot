import { generateBriefing } from "./generateBriefing.js";
import { buildTodayMissions } from "./missions/buildTodayMissions.js";

const LOCAL_FALLBACK_INSIGHT = {
  todayCapacity: 72,
  tomorrowCapacity: {
    baseline: 67,
    withMissions: 74,
    delta: 7,
    confidence: "Medium",
    reason:
      "睡眠時間はやや短めです。軽い運動と早めの就寝で、明日の回復と集中力の改善が期待できます。",
  },
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

export async function generateHealthPilotInsight(input) {
  let resolvedInput = input;

  if (!resolvedInput) {
    const { buildAiInput } = await import("./mockInput.js");
    resolvedInput = (await buildAiInput()).input;
  }

  const missions = await buildTodayMissions(resolvedInput);
  const tomorrowCapacityComment =
    typeof missions.tomorrowCapacityComment === "string" && missions.tomorrowCapacityComment.trim()
      ? missions.tomorrowCapacityComment.trim()
      : LOCAL_FALLBACK_INSIGHT.tomorrowCapacity.reason;

  return {
    ...LOCAL_FALLBACK_INSIGHT,
    missions,
    aiBriefing: generateBriefing(resolvedInput.normalizedHealthData),
    tomorrowCapacityComment,
  };
}