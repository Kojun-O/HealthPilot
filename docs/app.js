// =========================
// Health Pilot v0.2.0
// Health Agent Lite
// =========================

const healthData = {
  score: 89,
  idealScore: 95,
  missions: [
    {
      id: "sleep",
      title: "23:45までに寝る",
      priority: 5,
      impact: 4,
      category: "sleep"
    },
    {
      id: "steps",
      title: "あと2,300歩",
      priority: 4,
      impact: 2,
      category: "activity"
    },
    {
      id: "supplement",
      title: "レオピンファイブを朝夕服用",
      priority: 3,
      impact: 1,
      category: "habit"
    }
  ]
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

function createStars(count) {
  return "★".repeat(count) + "☆".repeat(5 - count);
}

function generateAgentAdvice(data) {
  const topMission = data.missions[0];
  const gap = data.idealScore - data.score;

  if (topMission.category === "sleep") {
    return `今日は睡眠を優先しましょう。<br>
${topMission.title}を達成できると、理想まであと${Math.max(gap - topMission.impact, 0)}点まで近づけます😊`;
  }

  if (topMission.category === "activity") {
    return `今日は活動量を少し足すと良さそうです。<br>
${topMission.title}を意識すると、健康スコアの改善が期待できます🚶`;
  }

  return `今日は小さな習慣を整える日です。<br>
無理なく1つずつ達成していきましょう🌿`;
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
    missionList.innerHTML = "";

    data.missions.forEach((mission) => {
      const li = document.createElement("li");
      li.textContent = `${createStars(mission.priority)} ${mission.title}（+${mission.impact}）`;
      missionList.appendChild(li);
    });
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
    greetingText.textContent = "今日は睡眠を優先しましょう。";
  } else if (hour < 18) {
    greetingTitle.textContent = "🌤️ こんにちは！";
    greetingText.textContent = "午後も無理せずいきましょう。";
  } else {
    greetingTitle.textContent = "🌙 お疲れさまです！";
    greetingText.textContent = "今日は早めに休みましょう。";
  }
}

updateGreeting();
renderHealthPilot(healthData);

console.log("Health Agent Lite started");