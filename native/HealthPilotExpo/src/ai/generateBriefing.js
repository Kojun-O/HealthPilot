const HIGH_SLEEP_SCORE = 80;
const LOW_SLEEP_SCORE = 50;
const HIGH_STEP_COUNT = 8000;

function toNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function statusFromHrvMs(hrvMs) {
  const value = toNumber(hrvMs);

  if (value === null) {
    return "unknown";
  }

  if (value >= 50) {
    return "high";
  }

  if (value <= 25) {
    return "low";
  }

  return "medium";
}

function statusFromRestingHeartRateBpm(restingHeartRateBpm) {
  const value = toNumber(restingHeartRateBpm);

  if (value === null) {
    return "unknown";
  }

  if (value <= 60) {
    return "low";
  }

  if (value <= 70) {
    return "medium";
  }

  return "high";
}

function getHrvStatus(normalizedHealthData) {
  return (
    normalizedHealthData?.recovery?.hrvStatus ??
    statusFromHrvMs(normalizedHealthData?.recovery?.hrvMs)
  );
}

function getRestingHeartRateStatus(normalizedHealthData) {
  return (
    normalizedHealthData?.recovery?.restingHeartRateStatus ??
    statusFromRestingHeartRateBpm(normalizedHealthData?.recovery?.restingHeartRateBpm)
  );
}

function isPositiveRecovery(normalizedHealthData) {
  return (
    getHrvStatus(normalizedHealthData) === "high" &&
    getRestingHeartRateStatus(normalizedHealthData) === "low"
  );
}

export function generateBriefing(normalizedHealthData = {}) {
  const sleepScore = toNumber(normalizedHealthData?.sleep?.score);
  const hrvStatus = getHrvStatus(normalizedHealthData);
  const restingHeartRateStatus = getRestingHeartRateStatus(normalizedHealthData);
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
