// ======================================
// Health Pilot
// Context Builder
// ======================================

function buildHealthContext(data) {

    const score = HealthEngine.calculateHealthScore(data);
    const missions = HealthEngine.generateMissions(data);

    return {

        date: new Date().toLocaleDateString(),

        healthScore: score.total,

        breakdown: score.breakdown,

        missions: missions,

        summary: {

            sleepHours: data.sleepHours,

            steps: data.steps,

            recovery: data.recoveryScore

        }

    };

}

window.ContextBuilder = {

    buildHealthContext

};

console.log("Context Builder loaded");