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
let currentMission = null;

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

function getStorage() {
  try {
    return window.sessionStorage;
  } catch (error) {
    return null;
  }
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36) || "mission";
}

function getMissionCompletionStorageKey(mission) {
  const safeMission = mission && typeof mission === "object" ? mission : {};
  const title = getMissionText(safeMission, "title", "mission");
  const action = getMissionText(safeMission, "action", "mission");
  const minutes = getMissionMinutes(safeMission);
  const todayKey = getTodayKey();

  return `healthpilot:mission-completed:${todayKey}:${slugify(title)}:${slugify(action)}:${slugify(minutes)}`;
}

function isMissionCompleted(mission) {
  const storage = getStorage();
  if (!storage) return false;

  return storage.getItem(getMissionCompletionStorageKey(mission)) === "true";
}

function setMissionCompleted(mission, completed) {
  const storage = getStorage();
  if (!storage) return;

  storage.setItem(getMissionCompletionStorageKey(mission), completed ? "true" : "false");
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

function renderInsight(insight) {
  const headline = document.getElementById("insight-headline");
  const message = document.getElementById("insight-message");

  if (!headline || !message) return;

  const safeInsight = insight && typeof insight === "object" ? insight : {};
  const insightHeadline = typeof safeInsight.headline === "string" && safeInsight.headline.trim()
    ? safeInsight.headline
    : "今日のヒント";
  const insightMessage = typeof safeInsight.message === "string" && safeInsight.message.trim()
    ? safeInsight.message
    : "体調に合わせて、まずは小さな一歩を始めてみましょう。";

  headline.textContent = insightHeadline;
  message.textContent = insightMessage;
}

function attachMissionButtonHandler() {
  const missionList = document.getElementById("mission-list");

  if (!missionList || missionList.dataset.bound === "true") return;

  missionList.addEventListener("click", function (event) {
    const button = event.target.closest(".mission-button");

    if (!button || button.disabled || !currentMission) return;

    setMissionCompleted(currentMission, true);
    renderMission(currentMission);
  });

  missionList.dataset.bound = "true";
}

function renderMission(mission) {
  currentMission = mission;

  const missionList = document.getElementById("mission-list");

  if (!missionList) return;

  const safeMission = mission && typeof mission === "object" ? mission : {};
  const title = getMissionText(safeMission, "title", "今日の一歩");
  const reason = getMissionText(safeMission, "reason", "今日の状態に合わせて選ばれた一歩です。");
  const action = getMissionText(safeMission, "action", "まずは静かに始めてみましょう。");
  const minutes = getMissionMinutes(safeMission);
  const intensity = getMissionIntensityLabel(getMissionText(safeMission, "intensity", "low"));
  const category = getMissionCategoryLabel(getMissionText(safeMission, "category", "recovery"));
  const isCompleted = isMissionCompleted(safeMission);
  const buttonLabel = isCompleted ? "完了済み" : "完了した";
  const completionMessage = isCompleted
    ? '<p class="mission-completion-message" aria-live="polite">完了しました。今日も一歩前進です。</p>'
    : "";

  missionList.innerHTML = `
    <li>
      <div class="mission-card${isCompleted ? " is-completed" : ""}">
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

        ${completionMessage}
        <button class="mission-button" type="button" ${isCompleted ? "disabled" : ""}>${buttonLabel}</button>

        <details class="mission-reason">
          <summary>なぜこのミッション？</summary>
          <p>${escapeHtml(reason)}</p>
        </details>
      </div>
    </li>
  `;

  attachMissionButtonHandler();
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
  const insight = DailyInsightEngine.generateDailyInsight(dailyCondition);
  const mission = HealthEngine.generateDailyMission(dailyCondition);

  const safeTitle = getMissionText(mission, "title", "今日の一歩");
  const advice = `今日のMissionは「${safeTitle}」です。<br>
まずはこの1つだけに集中しましょう。`;

  renderInsight(insight);
  renderMission(mission);
  renderAdvice(advice);

  console.log("Raw health data:", rawHealthData);
  console.log("Daily insight:", insight);
  console.log("Normalized daily condition:", dailyCondition);
  console.log("Mission First:", mission);
}

startHealthPilot();

console.log(`${APP.name} v${APP.version}`);