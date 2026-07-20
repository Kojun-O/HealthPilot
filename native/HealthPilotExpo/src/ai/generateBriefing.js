const HIGH_SLEEP_SCORE = 80;
const LOW_SLEEP_SCORE = 50;
const HIGH_STEP_COUNT = 8000;

function toNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isPositiveRecovery(normalizedHealthData) {
  return (
    normalizedHealthData?.recovery?.hrvStatus === "high" &&
    normalizedHealthData?.recovery?.restingHeartRateStatus === "low"
  );
}

export function generateBriefing(normalizedHealthData = {}) {
  const sleepScore = toNumber(normalizedHealthData?.sleep?.score);
  const hrvStatus = normalizedHealthData?.recovery?.hrvStatus ?? "unknown";
  const restingHeartRateStatus =
    normalizedHealthData?.recovery?.restingHeartRateStatus ?? "unknown";
  const steps = toNumber(normalizedHealthData?.activity?.steps);

  if (sleepScore !== null && sleepScore >= HIGH_SLEEP_SCORE && isPositiveRecovery(normalizedHealthData)) {
    return {
      title: "Good morning",
      message: "今日は昨日より回復しています。",
    };
  }

  if (
    sleepScore !== null &&
    sleepScore <= LOW_SLEEP_SCORE &&
    (hrvStatus === "low" || restingHeartRateStatus === "high")
  ) {
    return {
      title: "Take it easy",
      message: "今日は少し疲労が残っています。",
    };
  }

  if (
    sleepScore !== null &&
    sleepScore >= HIGH_SLEEP_SCORE &&
    (hrvStatus === "low" || restingHeartRateStatus === "high")
  ) {
    return {
      title: "Keep the pace",
      message: "睡眠は取れていますが、回復はまだ少し追いついていません。",
    };
  }

  if (
    sleepScore !== null &&
    sleepScore <= LOW_SLEEP_SCORE &&
    (hrvStatus === "high" || restingHeartRateStatus === "low")
  ) {
    return {
      title: "Watch the pace",
      message: "睡眠は浅めですが、回復の手応えはあります。",
    };
  }

  if (steps !== null && steps >= HIGH_STEP_COUNT) {
    return {
      title: "Active day",
      message: "今日はよく動けています。無理のない範囲で続けましょう。",
    };
  }

  return {
    title: "Good morning",
    message: "今日は安定しています。いつも通りで大丈夫です。",
  };
}
