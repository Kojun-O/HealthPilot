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
let dailyContextDraft = null;

const MOCK_CAPACITY_CONTEXT = "Based on your latest data";
const MOCK_CAPACITY_THOUGHT = "Today's Capacity reflects how today's strongest signals are shaping your available margin.";
const DAILY_CONTEXT_STORAGE_KEY = "healthPilot.dailyContext";
const DAILY_CONTEXT_CATEGORIES = ["Physical", "Mental", "Work", "Family", "Other"];
const MISSION_DESCRIPTION_MAX_LENGTH = 90;

function renderAdvice(advice) {
  const insightCopy = document.querySelector(".mission-insight-copy");

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

function getLocalStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function normalizeDailyContext(value) {
  const safeValue = value && typeof value === "object" ? value : {};
  const category = typeof safeValue.category === "string" && DAILY_CONTEXT_CATEGORIES.includes(safeValue.category)
    ? safeValue.category
    : "";
  const note = typeof safeValue.note === "string"
    ? safeValue.note.trim()
    : "";
  const date = typeof safeValue.date === "string" && safeValue.date
    ? safeValue.date
    : getTodayKey();

  return { category, note, date };
}

function loadDailyContext() {
  const storage = getLocalStorage();

  if (!storage) {
    return normalizeDailyContext({});
  }

  const rawValue = storage.getItem(DAILY_CONTEXT_STORAGE_KEY);

  if (!rawValue) {
    return normalizeDailyContext({});
  }

  try {
    const parsed = JSON.parse(rawValue);
    const normalized = normalizeDailyContext(parsed);

    if (normalized.date !== getTodayKey()) {
      storage.removeItem(DAILY_CONTEXT_STORAGE_KEY);
      return normalizeDailyContext({});
    }

    return normalized;
  } catch (error) {
    storage.removeItem(DAILY_CONTEXT_STORAGE_KEY);
    return normalizeDailyContext({});
  }
}

function saveDailyContext(value) {
  const storage = getLocalStorage();
  const normalized = normalizeDailyContext({
    ...value,
    date: getTodayKey()
  });

  if (!storage) {
    return normalized;
  }

  storage.setItem(DAILY_CONTEXT_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
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

function toSingleSentence(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  const sentenceEndIndex = normalized.search(/[.!?。！？]/);

  if (sentenceEndIndex >= 0) {
    return normalized.slice(0, sentenceEndIndex + 1).trim();
  }

  return normalized;
}

function toConciseMissionDescription(value, fallback) {
  const source = toSingleSentence(value) || toSingleSentence(fallback);

  if (!source) {
    return "Take one small step that supports your energy today.";
  }

  if (source.length <= MISSION_DESCRIPTION_MAX_LENGTH) {
    return source;
  }

  const trimmed = source.slice(0, MISSION_DESCRIPTION_MAX_LENGTH).trim();
  return `${trimmed}.`;
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
  const summary = typeof missions === "string" ? missions : "";

  if (copy) {
    const safeSummary = escapeHtml(summary || "今日の状態に合わせた小さな一歩です。")
      .replace(/\n\n/g, "<br><br>")
      .replace(/\n/g, "<br>");
    copy.innerHTML = safeSummary;
  }
}

function renderMission(missions) {
  const missionList = document.getElementById("mission-list") || document.querySelector(".mission-list");
  const counter = document.querySelector(".counter-pill");
  const progressDots = document.querySelector(".mission-progress-dots");

  if (!missionList) return;

  const normalizedMissions = Array.isArray(missions) ? missions : [missions];
  const renderedMissions = normalizedMissions.slice(0, 3);

  console.log("Selected missions for render:", normalizedMissions);

  const missionItems = renderedMissions.map((mission, index) => {
    const title = getMissionText(mission, "title", "今日の一歩");
    const impactValue = Math.max(1, Math.round(Number(mission && mission.impact) || 0));
    const subtitle = toConciseMissionDescription(
      getMissionText(mission, "conciseDescription", getMissionText(mission, "description", "")),
      index === 0 ? "ゆっくり呼吸してリセット。" : "体を整える小さな一歩を実行する。"
    );
    const missionIcon = getMissionText(mission, "icon", index === 0 ? "◌" : index === 1 ? "▭" : "•");
    const isCompleted = index < 2;

    return `
      <li class="mission-item${isCompleted ? " is-complete" : ""}">
        <span class="mission-icon-circle" aria-hidden="true">
          <span class="mission-icon-glyph" aria-hidden="true">${escapeHtml(missionIcon)}</span>
        </span>
        <span class="mission-content">
          <span class="mission-label">${escapeHtml(title)}</span>
          <span class="mission-subtitle">${escapeHtml(subtitle)} · ${escapeHtml(`Tomorrow +${impactValue}`)}</span>
        </span>
        <span class="mission-status${isCompleted ? " mission-status-complete" : ""}" aria-hidden="true">${isCompleted ? "✓" : ""}</span>
      </li>
    `;
  }).join("");

  missionList.innerHTML = missionItems;

  const completedCount = Math.min(2, renderedMissions.length);

  if (counter) {
    counter.textContent = `${completedCount} / 3 完了`;
  }

  if (progressDots) {
    progressDots.innerHTML = Array.from({ length: 3 }, (_, index) => `
      <span class="mission-progress-dot${index < completedCount ? " is-active" : ""}" aria-hidden="true"></span>
    `).join("");
  }

  currentMission = normalizedMissions[0] || null;
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
  const checkInList = document.querySelector(".checkin-grid");

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

function renderDailyContext(context) {
  const safeContext = normalizeDailyContext(context);
  const noteField = document.getElementById("checkin-context-note");
  const statusEl = document.getElementById("checkin-context-status");
  const categoryButtons = document.querySelectorAll(".context-chip");

  dailyContextDraft = {
    category: safeContext.category,
    note: safeContext.note
  };

  categoryButtons.forEach((button) => {
    const isSelected = button.getAttribute("data-context-category") === safeContext.category;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  if (noteField) {
    noteField.value = safeContext.note;
  }

  if (statusEl) {
    statusEl.textContent = safeContext.category || safeContext.note
      ? "この端末に今日の内容を保存しました"
      : "";
  }
}

function bindDailyContextEvents() {
  const card = document.getElementById("checkin-context");
  const noteField = document.getElementById("checkin-context-note");
  const saveButton = document.getElementById("checkin-context-save");
  const statusEl = document.getElementById("checkin-context-status");

  if (!card || !noteField || !saveButton || card.dataset.bound === "true") {
    return;
  }

  card.addEventListener("click", (event) => {
    const button = event.target && typeof event.target.closest === "function"
      ? event.target.closest(".context-chip")
      : null;

    if (!button) {
      return;
    }

    const nextCategory = button.getAttribute("data-context-category") || "";
    const currentCategory = dailyContextDraft && typeof dailyContextDraft === "object"
      ? dailyContextDraft.category
      : "";

    dailyContextDraft = {
      category: currentCategory === nextCategory ? "" : nextCategory,
      note: noteField.value
    };

    renderDailyContext(dailyContextDraft);

    if (statusEl) {
      statusEl.textContent = "";
    }
  });

  noteField.addEventListener("input", () => {
    dailyContextDraft = {
      category: dailyContextDraft && typeof dailyContextDraft === "object" ? dailyContextDraft.category : "",
      note: noteField.value
    };

    if (statusEl) {
      statusEl.textContent = "";
    }
  });

  saveButton.addEventListener("click", () => {
    const savedContext = saveDailyContext({
      category: dailyContextDraft && typeof dailyContextDraft === "object" ? dailyContextDraft.category : "",
      note: noteField.value
    });

    renderDailyContext(savedContext);
  });

  card.dataset.bound = "true";
}

function formatCapacityFactorNames(names) {
  const safeNames = Array.isArray(names)
    ? names.filter((name) => typeof name === "string" && name.trim()).map((name) => name.trim().toLowerCase())
    : [];

  if (!safeNames.length) {
    return "";
  }

  if (safeNames.length === 1) {
    return safeNames[0];
  }

  if (safeNames.length === 2) {
    return `${safeNames[0]} and ${safeNames[1]}`;
  }

  return `${safeNames.slice(0, -1).join(", ")}, and ${safeNames[safeNames.length - 1]}`;
}

function buildCapacityThought(capacity) {
  const safeCapacity = capacity && typeof capacity === "object" ? capacity : {};
  const factors = Array.isArray(safeCapacity.factors) ? safeCapacity.factors : [];
  const positiveNames = factors
    .filter((factor) => Number(factor && factor.impact) > 0)
    .slice(0, 2)
    .map((factor) => factor.name);
  const negativeNames = factors
    .filter((factor) => Number(factor && factor.impact) < 0)
    .slice(0, 2)
    .map((factor) => factor.name);
  const positiveVerb = positiveNames.length === 1 ? "is" : "are";
  const negativeVerb = negativeNames.length === 1 ? "is" : "are";

  if (negativeNames.length && positiveNames.length) {
    return `Today's Capacity is lower because ${formatCapacityFactorNames(negativeNames)} ${negativeVerb} reducing your available margin, even though ${formatCapacityFactorNames(positiveNames)} ${positiveVerb} helping.`;
  }

  if (negativeNames.length) {
    return `Today's Capacity is lower because ${formatCapacityFactorNames(negativeNames)} ${negativeVerb} reducing your available margin.`;
  }

  if (positiveNames.length) {
    return `Today's Capacity is supported by ${formatCapacityFactorNames(positiveNames)}.`;
  }

  return typeof safeCapacity.thought === "string" && safeCapacity.thought.trim()
    ? safeCapacity.thought
    : MOCK_CAPACITY_THOUGHT;
}

function buildCapacityFactorItem(factor) {
  const safeFactor = factor && typeof factor === "object" ? factor : {};
  const label = typeof safeFactor.name === "string" && safeFactor.name.trim()
    ? safeFactor.name
    : typeof safeFactor.label === "string" && safeFactor.label.trim()
      ? safeFactor.label
      : "Factor";
  const iconMap = {
    Sleep: "😴",
    Recovery: "❤️",
    Activity: "🚶",
    Stress: "⚡",
    Workload: "💼",
    Pain: "🦶"
  };
  const icon = typeof safeFactor.icon === "string" && safeFactor.icon.trim()
    ? safeFactor.icon
    : iconMap[label] || "•";
  const impactValue = Number.isFinite(Number(safeFactor.impact))
    ? Math.round(Number(safeFactor.impact))
    : Number.isFinite(Number(safeFactor.value))
      ? Math.round(Number(safeFactor.value))
      : 0;
  const value = `${impactValue >= 0 ? "+" : ""}${impactValue}`;
  const valueClass = value.trim().startsWith("-") ? " is-negative" : " is-positive";

  return `
    <li class="capacity-factor-item">
      <span class="capacity-factor-icon" aria-hidden="true">${escapeHtml(icon)}</span>
      <span class="capacity-factor-label">${escapeHtml(label)}</span>
      <span class="capacity-factor-value${valueClass}">${escapeHtml(value)}</span>
    </li>
  `;
}

function renderTodaysCapacity(capacity) {
  const scoreEl = document.getElementById("capacity-score");
  const statusEl = document.getElementById("capacity-status");
  const contextEl = document.getElementById("capacity-context");
  const thoughtEl = document.getElementById("capacity-thought");
  const factorsEl = document.getElementById("capacity-factors");
  const barEl = document.getElementById("capacity-bar");

  const safeCapacity = capacity && typeof capacity === "object" ? capacity : {};
  const rawScore = Number(safeCapacity.score ?? safeCapacity.capacity);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 0;
  const filledSegments = Math.max(0, Math.min(10, Math.round(score / 10)));

  if (scoreEl) {
    scoreEl.textContent = String(score);
  }

  if (statusEl) {
    statusEl.textContent = typeof safeCapacity.status === "string" && safeCapacity.status.trim()
      ? safeCapacity.status
      : "Ready";
  }

  if (contextEl) {
    contextEl.textContent = typeof safeCapacity.context === "string" && safeCapacity.context.trim()
      ? safeCapacity.context
      : MOCK_CAPACITY_CONTEXT;
  }

  if (thoughtEl) {
    thoughtEl.textContent = buildCapacityThought(safeCapacity);
  }

  if (barEl) {
    barEl.innerHTML = Array.from({ length: 10 }, (_, index) => (
      `<span class="capacity-segment${index < filledSegments ? " is-filled" : ""}" aria-hidden="true"></span>`
    )).join("");
  }

  if (factorsEl) {
    const factors = Array.isArray(safeCapacity.factors) ? safeCapacity.factors.slice(0, 4) : [];
    factorsEl.innerHTML = factors.map(buildCapacityFactorItem).join("");
  }
}

function bindCapacityToggle() {
  const capacityCard = document.getElementById("today-capacity");
  const toggle = document.getElementById("capacity-toggle");

  if (!capacityCard || !toggle || toggle.dataset.bound === "true") {
    return;
  }

  toggle.addEventListener("click", () => {
    const expanded = capacityCard.classList.toggle("is-expanded");
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
  });

  toggle.dataset.bound = "true";
}

function startHealthPilot() {
  const rawHealthData = {
    sleepScore: 42,
    recoveryScore: 48,
    activityScore: 38,
    stressLevel: 72,
    stressScore: 72,
    workloadLevel: 68,
    painLevel: 24,
    energyLevel: 38,
    focusLevel: 45,
    bodyCondition: "肩が少し張っている",
    note: "昨夜は寝付きが悪かった"
  };

  const dailyCondition = HealthDataAdapter.normalizeHealthData(rawHealthData);
  const insight = DailyInsightEngine.generateDailyInsight(dailyCondition);
  const capacityInput = {
    sleepScore: rawHealthData.sleepScore,
    recoveryScore: rawHealthData.recoveryScore,
    activityScore: rawHealthData.activityScore,
    stressScore: rawHealthData.stressScore,
    workloadLevel: rawHealthData.workloadLevel,
    painLevel: rawHealthData.painLevel
  };
  const capacity = window.CapacityCalculator && typeof window.CapacityCalculator.calculateCapacity === "function"
    ? window.CapacityCalculator.calculateCapacity(capacityInput)
    : {
        capacity: 0,
        status: "Recovery first",
        factors: []
      };
  const savedDailyContext = loadDailyContext();
  const dailyContext = {
    timeOfDay: "morning",
    weekday: new Date().getDay(),
    recentCompletionRate: 67,
    streakDays: 3,
    category: savedDailyContext.category,
    note: savedDailyContext.note
  };
  const recommendations = window.RecommendationEngine && typeof window.RecommendationEngine.generateRecommendations === "function"
    ? window.RecommendationEngine.generateRecommendations(capacity, dailyContext)
    : [];
  const missionPlan = window.MissionEngine && typeof window.MissionEngine.buildMissionPlan === "function"
    ? window.MissionEngine.buildMissionPlan({
        recommendations,
        capacity,
        dailyContext
      })
    : null;
  const missions = missionPlan && Array.isArray(missionPlan.topMissions) && missionPlan.topMissions.length
    ? missionPlan.topMissions
    : window.MissionBuilder && typeof window.MissionBuilder.generateMissions === "function"
      ? window.MissionBuilder.generateMissions(recommendations)
      : [];
  const missionSummary = window.MissionEngine && typeof window.MissionEngine.generateMissionSummary === "function"
    ? window.MissionEngine.generateMissionSummary(missions)
    : window.MissionBuilder && typeof window.MissionBuilder.generateMissionSummary === "function"
      ? window.MissionBuilder.generateMissionSummary(missions)
      : "今日は回復を優先しましょう。\n\nまずは「5分ストレッチ」から始めるのがおすすめです。";
  const whyMissionText = missionPlan && missionPlan.topMission && typeof missionPlan.topMission.rationale === "string"
    ? missionPlan.topMission.rationale
    : missionSummary;
  const advice = missionSummary.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");

  renderTodaysCapacity(capacity);
  bindCapacityToggle();
  renderInsight(insight);
  renderMission(missions);
  renderAdvice(advice);
  renderWhyMissions(whyMissionText);

  const checkInEngine = window.CheckInEngine;
  if (checkInEngine && typeof checkInEngine.loadTodayCheckIn === "function") {
    const todayCheckIn = checkInEngine.loadTodayCheckIn();
    renderCheckIn(todayCheckIn);
    bindCheckInEvents();
  }

  renderDailyContext(savedDailyContext);
  bindDailyContextEvents();

  console.log("Raw health data:", rawHealthData);
  console.log("Daily insight:", insight);
  console.log("Normalized daily condition:", dailyCondition);
  console.log("Recommendations:", recommendations);
  console.log("Mission plan:", missionPlan);
  console.log("Missions:", missions);
}

startHealthPilot();

console.log(`${APP.name} v${APP.version}`);