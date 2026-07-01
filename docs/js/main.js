// ======================================
// Health Pilot
// Main Entry Point
// ======================================

console.log("🌿 Health Pilot starting...");

const APP = {
    name: "Health Pilot",
    version: "0.4.2",
    aiProvider: "built-in"
};

window.APP = APP;

function renderAdvice(advice) {
    const aiComment = document.getElementById("ai-comment");

    if (aiComment) {
        aiComment.innerHTML = advice;
    }
}

function renderMissions(missions) {
    const missionList = document.getElementById("mission-list");

    if (!missionList) return;

    missionList.innerHTML = "";

    missions.forEach((mission) => {
        const li = document.createElement("li");

        const stars = "★".repeat(mission.priority) + "☆".repeat(5 - mission.priority);

        li.textContent = `${stars} ${mission.title}（+${mission.impact}）`;

        missionList.appendChild(li);
    });
}

function startHealthPilot() {
    const data = HealthEngine.sampleHealthData;
    const context = ContextBuilder.buildHealthContext(data);
    const advice = BuiltInAI.generateAdvice(context);

    renderAdvice(advice);
    renderMissions(context.missions);

    console.log("Health context:", context);
    console.log("Built-in AI advice:", advice);
    console.log("Dynamic missions:", context.missions);
}

startHealthPilot();

console.log(`${APP.name} v${APP.version}`);