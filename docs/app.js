// =========================
// Health Pilot v0.2.0
// Mission First Prototype
// =========================

const healthData = {
  score: 89,
  idealScore: 95,
  mission: {
    id: "morning-walk",
    title: "10:00までに20分外を歩く",
    action: "外に出て20分歩く",
    timing: "10:00まで",
    reason: [
      "朝の光で覚醒と気分を整える",
      "睡眠負債の影響を軽くする",
      "今日の集中力を上げる"
    ],
    priority: 5,
    impact: 4,
    category: "activity"
  }
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
${mission.reason[0]}ため、まずはこの1つに集中しましょう。<br>
達成できると、理想まであと${Math.max(gap - mission.impact, 0)}点まで近づけます🚶`;
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
          <p class="mission-deadline"><strong>${mission.timing}</strong></p>

          <button class="mission-button" type="button">完了した</button>

          <details class="mission-reason">
            <summary>Why this mission?</summary>
            <ul>
              ${mission.reason.map((item) => `<li>${item}</li>`).join("")}
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