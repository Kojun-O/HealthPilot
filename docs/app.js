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

function generateAgentAdvice(data) {
  const mission = data.mission;
  const gap = data.idealScore - data.score;

  return `今日のMissionは「${mission.title}」です。<br>
${mission.reason}ため、まずはこの1つに集中しましょう。<br>
達成できると、理想まであと${Math.max(gap - mission.estimatedMinutes, 0)}点まで近づけます🚶`;
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
    const mission = data.mission;

    missionList.innerHTML = `
      <li>
        <div class="mission-card">
          <h2>${mission.title}</h2>
          <p class="mission-action">${mission.action}</p>
          <p class="mission-meta">${mission.category} · ${mission.intensity} · ${mission.estimatedMinutes}分</p>

          <button class="mission-button" type="button">完了した</button>

          <details class="mission-reason">
            <summary>Why this mission?</summary>
            <ul>
              <li>${mission.reason}</li>
            </ul>
          </details>
        </div>
      </li>
    `;
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