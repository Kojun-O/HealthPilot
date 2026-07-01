// ======================================
// Health Pilot
// Health Engine
// ======================================

const sampleHealthData = {
    sleepHours: 5.9,
    targetSleepHours: 7.0,
    steps: 8629,
    targetSteps: 8000,
    recoveryScore: 77,
    weightStable: true,
    habitsCompleted: 1,
    habitsTotal: 3
};

function calculateSleepScore(data) {
    const ratio = data.sleepHours / data.targetSleepHours;
    return Math.min(Math.round(ratio * 35), 35);
}

function calculateActivityScore(data) {
    const ratio = data.steps / data.targetSteps;
    return Math.min(Math.round(ratio * 20), 20);
}

function calculateRecoveryScore(data) {
    return Math.round((data.recoveryScore / 100) * 20);
}

function calculateWeightScore(data) {
    return data.weightStable ? 15 : 10;
}

function calculateHabitScore(data) {
    if (data.habitsTotal === 0) return 0;
    return Math.round((data.habitsCompleted / data.habitsTotal) * 10);
}

function calculateHealthScore(data) {
    const sleep = calculateSleepScore(data);
    const activity = calculateActivityScore(data);
    const recovery = calculateRecoveryScore(data);
    const weight = calculateWeightScore(data);
    const habit = calculateHabitScore(data);

    return {
        total: sleep + activity + recovery + weight + habit,
        breakdown: {
            sleep,
            activity,
            recovery,
            weight,
            habit
        }
    };
}

function generateMissions(data) {
    const missions = [];

    if (data.sleepHours < data.targetSleepHours) {
        missions.push({
            title: "23:45までに寝る",
            category: "sleep",
            priority: 5,
            impact: 4
        });
    }

    if (data.steps < data.targetSteps) {
        missions.push({
            title: `あと${data.targetSteps - data.steps}歩`,
            category: "activity",
            priority: 4,
            impact: 2
        });
    }

    missions.push({
        title: "レオピンファイブを朝夕服用",
        category: "habit",
        priority: 3,
        impact: 1
    });

    return missions.slice(0, 3);
}

window.HealthEngine = {
    sampleHealthData,
    calculateHealthScore,
    generateMissions
};

console.log("Health Engine loaded");