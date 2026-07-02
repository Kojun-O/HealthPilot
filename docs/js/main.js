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

function renderMission(mission) {
  const missionList = document.getElementById("mission-list");

  if (!missionList) return;

  missionList.innerHTML = `
    <li>
      <div class="mission-card">
        <p class="mission-label">Today's Mission</p>
        <h2>${mission.title}</h2>
        <p>${mission.action}</p>
        <p><strong>${mission.timing}</strong></p>

        <button class="mission-button">完了した</button>

        <div class="mission-reason">
          <p><strong>Why?</strong></p>
          <ul>
            ${mission.reason.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      </div>
    </li>
  `;
}

function startHealthPilot() {
  const mission = {
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
  };

  const advice = `今日のMissionは「${mission.title}」です。<br>
まずはこの1つだけに集中しましょう。`;

  renderMission(mission);
  renderAdvice(advice);

  console.log("Mission First:", mission);
}

startHealthPilot();

console.log(`${APP.name} v${APP.version}`);