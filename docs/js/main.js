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

  const advice = `今日のMissionは「${mission.title}」です。<br>
まずはこの1つだけに集中しましょう。`;

  renderMission(mission);
  renderAdvice(advice);

  console.log("Raw health data:", rawHealthData);
  console.log("Normalized daily condition:", dailyCondition);
  console.log("Mission First:", mission);
}

startHealthPilot();

console.log(`${APP.name} v${APP.version}`);