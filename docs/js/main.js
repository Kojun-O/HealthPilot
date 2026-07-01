// ======================================
// Health Pilot
// Main Entry Point
// ======================================

console.log("🌿 Health Pilot starting...");

const APP = {
    name: "Health Pilot",
    version: "0.4.1",
    aiProvider: "built-in"
};

window.APP = APP;

function startHealthPilot() {
    const data = HealthEngine.sampleHealthData;
    const context = ContextBuilder.buildHealthContext(data);
    const advice = BuiltInAI.generateAdvice(context);

    const aiComment = document.getElementById("ai-comment");

    if (aiComment) {
        aiComment.innerHTML = advice;
    }

    console.log("Health context:", context);
    console.log("Built-in AI advice:", advice);
}

startHealthPilot();

console.log(`${APP.name} v${APP.version}`);