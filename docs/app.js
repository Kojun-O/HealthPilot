// =========================
// Health Pilot v0.6.0
// Mission Engine Prototype
// =========================

const rawDailyCondition = HealthEngine.sampleDailyCondition;
const normalizedDailyCondition = HealthDataAdapter.normalizeHealthData(rawDailyCondition);

const healthData = {
  score: 89,
  idealScore: 95,
  mission: HealthEngine.generateDailyMission(normalizedDailyCondition)
};

function getScoreLabel(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 70) return "Fair";
  return "Needs Care";
}

function getScoreColor(score) {
  if (score >= 85) return "#34C759";
  if (score >= 70) return "#FF9F0A";
  return "#FF3B30";
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

function buildMissionCardHtml(mission) {
  const safeMission = mission && typeof mission === "object" ? mission : {};
  const title = getMissionText(safeMission, "title", "今日の一歩");
  const reason = getMissionText(safeMission, "reason", "今日の状態に合わせて選ばれた一歩です。");
  const action = getMissionText(safeMission, "action", "まずは静かに始めてみましょう。");
  const minutes = getMissionMinutes(safeMission);
  const intensity = getMissionIntensityLabel(getMissionText(safeMission, "intensity", "low"));
  const category = getMissionCategoryLabel(getMissionText(safeMission, "category", "recovery"));

  return `
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

function generateAgentAdvice(data) {
  const mission = data && typeof data === "object" ? data.mission : undefined;
  const safeMission = mission && typeof mission === "object" ? mission : {};
  const title = getMissionText(safeMission, "title", "今日の一歩");
  const reason = getMissionText(safeMission, "reason", "今日の状態に合わせて選ばれた一歩です。");
  const minutes = getMissionMinutes(safeMission);
  const gap = data.idealScore - data.score;

  return `今日のMissionは「${title}」です。<br>
${reason}ため、まずはこの1つだけに集中しましょう。<br>
達成できると、理想まであと${Math.max(gap - minutes, 0)}点まで近づけます🚶`;
}

function renderHealthPilot(data) {
  const scoreElement = document.getElementById("score");
  const aiComment = document.getElementById("ai-comment");
  const missionList = document.getElementById("mission-list");

  if (scoreElement) {
    scoreElement.textContent = data.score;
    scoreElement.style.color = getScoreColor(data.score);
  }

  const scoreCardText = document.querySelector(".score p");
  if (scoreCardText) {
    scoreCardText.textContent = `理想まであと${data.idealScore - data.score}点・${getScoreLabel(data.score)}`;
  }

  if (missionList) {
    missionList.innerHTML = buildMissionCardHtml(data.mission);
  }

  if (aiComment) {
    aiComment.innerHTML = generateAgentAdvice(data);
  }
}

function updateGreeting() {
  const hour = new Date().getHours();
  const greetingTitle = document.querySelector(".greeting h2");
  const greetingText = document.querySelector(".greeting p");

  if (!greetingTitle || !greetingText) return;

  if (hour < 12) {
    greetingTitle.textContent = "☀️ おはようございます！";
    greetingText.textContent = "今日はこのMissionだけに集中しましょう。";
  } else if (hour < 18) {
    greetingTitle.textContent = "🌤️ こんにちは！";
    greetingText.textContent = "午後もMissionを1つだけ進めましょう。";
  } else {
    greetingTitle.textContent = "🌙 お疲れさまです！";
    greetingText.textContent = "明日に疲れを残さない判断をしましょう。";
  }
}

updateGreeting();
renderHealthPilot(healthData);

console.log("Mission First Prototype started");