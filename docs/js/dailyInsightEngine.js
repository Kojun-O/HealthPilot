// ======================================
// Health Pilot
// Daily Insight Engine v0.1
// ======================================

function clampInsightMetric(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(number)));
}

function createDefaultInsight() {
  return {
    headline: "今日も一歩進めそうです",
    message: "体調に合わせて、まずは小さな一歩を始めてみましょう。",
    tone: "positive",
    priority: "balanced"
  };
}

function generateDailyInsight(normalizedHealthData) {
  if (!normalizedHealthData || typeof normalizedHealthData !== "object") {
    return createDefaultInsight();
  }

  const recoveryScore = clampInsightMetric(normalizedHealthData.recoveryScore, 80);
  const stressLevel = clampInsightMetric(normalizedHealthData.stressLevel, 30);
  const sleepScore = clampInsightMetric(normalizedHealthData.sleepScore, 80);
  const focusLevel = clampInsightMetric(normalizedHealthData.focusLevel, 70);

  if (recoveryScore < 60) {
    return {
      headline: "今日は回復を優先したい日です",
      message: "昨日の疲れが残っているようなので、無理せず体をゆっくり整えることが大切です。",
      tone: "careful",
      priority: "recovery"
    };
  }

  if (stressLevel > 70) {
    return {
      headline: "気持ちが高ぶっているようです",
      message: "ストレスが高めなので、深呼吸とゆっくりした動作で落ち着きを取り戻しましょう。",
      tone: "calm",
      priority: "stability"
    };
  }

  if (sleepScore < 60) {
    return {
      headline: "睡眠の質を整えると良さそうです",
      message: "睡眠が足りていないので、今日は早めの休息と静かな時間を意識すると調子が整います。",
      tone: "gentle",
      priority: "sleep"
    };
  }

  if (focusLevel > 80) {
    return {
      headline: "今日は集中しやすい状態です",
      message: "頭の回転が良いので、重要な作業を午前中に進めると成果が出やすいです。",
      tone: "positive",
      priority: "focus"
    };
  }

  return {
    headline: "今日は落ち着いて進めるのがおすすめです",
    message: "バランスの良い一日を目指して、ひとつだけ確実に進めることを意識しましょう。",
    tone: "positive",
    priority: "balanced"
  };
}

window.DailyInsightEngine = {
  generateDailyInsight
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    generateDailyInsight
  };
}

console.log("Daily Insight Engine loaded");
