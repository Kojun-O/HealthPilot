// ======================================
// Health Pilot
// Main Entry Point
// Mission First Prototype
// ======================================

console.log("🌿 Health Pilot starting...");

const APP = {
  name: "Health Pilot",
  version: "0.5.0",
  aiProvider: "built-in"
};

window.APP = APP;

function renderAdvice(advice) {
  const aiComment = document.getElementById("ai-comment");

  if (aiComment) {
    aiComment.innerHTML = advice;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMissionText(mission, field, fallback) {
  const value = mission && typeof mission === "object" ? mission[field] : undefined;

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : fallback;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

function getMissionMinutes(mission) {
  const value = mission && typeof mission === "object" ? mission.estimatedMinutes : undefined;
  const minutes = Number(value);

  if (Number.isFinite(minutes) && minutes > 0) {
    return String(Math.round(minutes));
  }

  return "5";
}

function getMissionIntensityLabel(intensity) {
  const normalized = String(intensity || "").toLowerCase();

  if (normalized === "high") return "高";
  if (normalized === "medium") return "中";
  return "低";
}

function getMissionCategoryLabel(category) {
  const normalized = String(category || "").toLowerCase();

  if (normalized === "focus") return "集中";
  if (normalized === "movement") return "運動";
  if (normalized === "stability") return "安定";
  return "回復";
}

function renderMission(mission) {
  const missionList = document.getElementById("mission-list");

  if (!missionList) return;

  const safeMission = mission && typeof mission === "object" ? mission : {};
  const title = getMissionText(safeMission, "title", "今日の一歩");
  const reason = getMissionText(safeMission, "reason", "今日の状態に合わせて選ばれた一歩です。");
  const action = getMissionText(safeMission, "action", "まずは静かに始めてみましょう。");
  const minutes = getMissionMinutes(safeMission);
  const intensity = getMissionIntensityLabel(getMissionText(safeMission, "intensity", "low"));
  const category = getMissionCategoryLabel(getMissionText(safeMission, "category", "recovery"));

  missionList.innerHTML = `
    <li>
      <div class="mission-card">
        <h2>${escapeHtml(title)}</h2>

        <div class="mission-details">
          <div class="mission-detail">
            <span class="mission-label">理由</span>
            <p class="mission-value">${escapeHtml(reason)}</p>
          </div>

          <div class="mission-detail">
            <span class="mission-label">やること</span>
            <p class="mission-value">${escapeHtml(action)}</p>
          </div>

          <div class="mission-detail mission-detail-inline">
            <span class="mission-label">目安時間</span>
            <p class="mission-value">${escapeHtml(minutes)}分</p>
          </div>

          <div class="mission-detail mission-detail-inline">
            <span class="mission-label">強度</span>
            <p class="mission-value">${escapeHtml(intensity)}</p>
          </div>

          <div class="mission-detail mission-detail-inline">
            <span class="mission-label">カテゴリ</span>
            <p class="mission-value">${escapeHtml(category)}</p>
          </div>
        </div>

        <button class="mission-button" type="button">完了した</button>

        <details class="mission-reason">
          <summary>なぜこのミッション？</summary>
          <p>${escapeHtml(reason)}</p>
        </details>
      </div>
    </li>
  `;
}

function startHealthPilot() {
  const rawHealthData = {
    sleepScore: 42,
    recoveryScore: 48,
    stressLevel: 72,
    energyLevel: 38,
    focusLevel: 45,
    bodyCondition: "肩が少し張っている",
    note: "昨夜は寝付きが悪かった"
  };

  const dailyCondition = HealthDataAdapter.normalizeHealthData(rawHealthData);
  const mission = HealthEngine.generateDailyMission(dailyCondition);

  const safeTitle = getMissionText(mission, "title", "今日の一歩");
  const advice = `今日のMissionは「${safeTitle}」です。<br>
まずはこの1つだけに集中しましょう。`;

  renderMission(mission);
  renderAdvice(advice);

  console.log("Raw health data:", rawHealthData);
  console.log("Normalized daily condition:", dailyCondition);
  console.log("Mission First:", mission);
}

startHealthPilot();

console.log(`${APP.name} v${APP.version}`);