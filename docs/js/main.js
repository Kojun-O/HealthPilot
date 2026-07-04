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
  const insightCopy = document.querySelector(".card-insight .insight-copy");

  if (aiComment) {
    aiComment.innerHTML = advice;
  }

  if (insightCopy) {
    insightCopy.innerHTML = advice;
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
  if (normalized === "hydration") return "水分";
  if (normalized === "mental") return "メンタル";
  if (normalized === "sleep") return "睡眠";
  if (normalized === "stability") return "安定";
  return "回復";
}

function renderInsight(insight) {
  const headline = document.getElementById("insight-headline");
  const message = document.getElementById("insight-message");
  const insightCopy = document.querySelector(".card-insight .insight-copy");

  const safeInsight = insight && typeof insight === "object" ? insight : {};
  const insightHeadline = typeof safeInsight.headline === "string" && safeInsight.headline.trim()
    ? safeInsight.headline
    : "今日のヒント";
  const insightMessage = typeof safeInsight.message === "string" && safeInsight.message.trim()
    ? safeInsight.message
    : "体調に合わせて、まずは小さな一歩を始めてみましょう。";

  if (headline) {
    headline.textContent = insightHeadline;
  }

  if (message) {
    message.textContent = insightMessage;
  }

  if (insightCopy) {
    insightCopy.textContent = insightMessage;
  }
}

function renderWhyMissions(missions) {
  const details = document.querySelector(".why-missions");

  if (!details) return;

  const copy = details.querySelector("p");
  const normalizedMissions = Array.isArray(missions) ? missions : [];
  const reasons = normalizedMissions
    .map((mission) => getMissionText(mission, "reason", ""))
    .filter(Boolean)
    .slice(0, 2);

  if (copy) {
    copy.innerHTML = reasons.length > 0
      ? reasons.map((reason) => escapeHtml(reason)).join("<br>")
      : "今日の状態に合わせた小さな一歩です。";
  }
}

function renderMission(missions) {
  const missionList = document.getElementById("mission-list") || document.querySelector(".mission-list");
  const counter = document.querySelector(".counter-pill");

  if (!missionList) return;

  const normalizedMissions = Array.isArray(missions) ? missions : [missions];
  const renderedTitles = normalizedMissions.map((mission) => getMissionText(mission, "title", "今日の一歩"));

  console.log("Selected missions for render:", normalizedMissions);
  console.log("Rendered mission titles:", renderedTitles);

  const missionItems = renderedTitles.map((title) => `
      <li class="mission-item">
        <span class="mission-checkbox" aria-hidden="true"></span>
        <span class="mission-label">${escapeHtml(title)}</span>
      </li>
    `).join("");

  missionList.innerHTML = missionItems;

  if (counter) {
    counter.textContent = `${Math.min(normalizedMissions.length, 3)}/3`;
  }

  currentMission = normalizedMissions[0] || null;
  renderWhyMissions(normalizedMissions);
}

function buildStarButtons(currentValue) {
  return Array.from({ length: 5 }, (_, index) => {
    const value = index + 1;
    const isActive = value <= currentValue;

    return `
      <button
        type="button"
        class="star-button${isActive ? " is-active" : ""}"
        data-rating-value="${value}"
        aria-label="Rate ${value} star"
      >★</button>
    `;
  }).join("");
}

function renderCheckIn(checkInData) {
  const checkInRows = document.querySelectorAll(".checkin-row");

  if (!checkInRows.length) {
    return;
  }

  const safeCheckIn = checkInData && typeof checkInData === "object" ? checkInData : {};

  checkInRows.forEach((row) => {
    const category = row.getAttribute("data-category");
    const control = row.querySelector(".rating-control");

    if (!control || !category) {
      return;
    }

    const currentValue = Number(safeCheckIn[category] || 0);
    control.innerHTML = buildStarButtons(currentValue);
  });
}

function handleCheckInSelection(event) {
  const button = event.target && typeof event.target.closest === "function"
    ? event.target.closest(".star-button")
    : null;

  if (!button) {
    return;
  }

  const now = Date.now();
  const lastInteraction = Number(button.getAttribute("data-last-interaction") || 0);

  if (event.type === "pointerup") {
    event.preventDefault();
    event.stopPropagation();
  }

  if (event.type === "click" && now - lastInteraction < 250) {
    return;
  }

  const row = button.closest(".checkin-row");
  const category = row ? row.getAttribute("data-category") : null;
  const rating = Number(button.getAttribute("data-rating-value") || 0);

  if (!category) {
    return;
  }

  const engine = window.CheckInEngine;
  if (!engine || typeof engine.saveTodayCheckIn !== "function") {
    return;
  }

  button.setAttribute("data-last-interaction", String(now));
  const updatedCheckIn = engine.saveTodayCheckIn({ [category]: rating });
  renderCheckIn(updatedCheckIn);
}

function bindCheckInEvents() {
  const checkInList = document.querySelector(".checkin-list");

  if (!checkInList || checkInList.dataset.bound === "true") {
    return;
  }

  const supportsPointerEvents = typeof window !== "undefined" && typeof window.PointerEvent !== "undefined";

  if (supportsPointerEvents) {
    checkInList.addEventListener("pointerup", handleCheckInSelection);
  }

  checkInList.addEventListener("click", handleCheckInSelection);
  checkInList.dataset.bound = "true";
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
  const missions = window.DecisionEngine && typeof window.DecisionEngine.generateDailyMissions === "function"
    ? window.DecisionEngine.generateDailyMissions(dailyCondition)
    : [];
  const firstMission = Array.isArray(missions) && missions.length > 0 ? missions[0] : null;
  const safeTitle = getMissionText(firstMission, "title", "今日の一歩");
  const advice = `今日のMissionは「${safeTitle}」です。<br>
まずはこの3つのうち、今日の優先順位が高いものから進めましょう。`;

  renderInsight(insight);
  renderMission(missions);
  renderAdvice(advice);

  const checkInEngine = window.CheckInEngine;
  if (checkInEngine && typeof checkInEngine.loadTodayCheckIn === "function") {
    const todayCheckIn = checkInEngine.loadTodayCheckIn();
    renderCheckIn(todayCheckIn);
    bindCheckInEvents();
  }

  console.log("Raw health data:", rawHealthData);
  console.log("Daily insight:", insight);
  console.log("Normalized daily condition:", dailyCondition);
  console.log("Mission First:", firstMission);
}

startHealthPilot();

console.log(`${APP.name} v${APP.version}`);