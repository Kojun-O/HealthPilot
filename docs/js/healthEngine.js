// ======================================
// Health Pilot
// Mission Engine v0.6
// ======================================

/**
 * @typedef {Object} DailyCondition
 * @property {number} sleepScore
 * @property {number} recoveryScore
 * @property {number} stressLevel
 * @property {number} energyLevel
 * @property {number} focusLevel
 * @property {string} [bodyCondition]
 * @property {string} [note]
 */

/**
 * @typedef {Object} Mission
 * @property {string} id
 * @property {string} title
 * @property {string} reason
 * @property {string} action
 * @property {"low"|"medium"|"high"} intensity
 * @property {"recovery"|"focus"|"movement"|"stability"} category
 * @property {number} estimatedMinutes
 * @property {string} primaryMetric
 */

const sampleDailyCondition = {
    sleepScore: 42,
    recoveryScore: 48,
    stressLevel: 72,
    energyLevel: 38,
    focusLevel: 45,
    bodyCondition: "肩が少し張っている",
    note: "昨夜は寝付きが悪かった"
};

const missionCatalog = {
    recovery: {
        id: "recovery-reset",
        title: "深呼吸と軽いストレッチで体をリセット",
        reason: "睡眠と回復が低めなので、まずは体を落ち着ける行動を選びます。",
        action: "5分間の深呼吸と首・肩の軽いストレッチを行う",
        intensity: "low",
        category: "recovery",
        estimatedMinutes: 10,
        primaryMetric: "recoveryScore"
    },
    focus: {
        id: "focus-session",
        title: "短時間の集中セッションを作る",
        reason: "集中力が下がっているときは、すぐできる小さな習慣でリズムを作ります。",
        action: "次の25分をタイマーで集中作業に使う",
        intensity: "medium",
        category: "focus",
        estimatedMinutes: 25,
        primaryMetric: "focusLevel"
    },
    movement: {
        id: "movement-walk",
        title: "近所を軽く歩いて気分を切り替える",
        reason: "状態が良ければ、軽い運動で一日の勢いをつけます。",
        action: "外に出て15分間のウォーキングをする",
        intensity: "medium",
        category: "movement",
        estimatedMinutes: 15,
        primaryMetric: "energyLevel"
    },
    stability: {
        id: "stability-breath",
        title: "落ち着いた呼吸で気持ちを整える",
        reason: "ストレスが高いときは、まず安定した呼吸と姿勢を整えましょう。",
        action: "3分間のゆっくり呼吸と姿勢チェックを行う",
        intensity: "low",
        category: "stability",
        estimatedMinutes: 5,
        primaryMetric: "stressLevel"
    }
};

/**
 * @param {DailyCondition} input
 * @returns {Mission}
 */
function generateDailyMission(input) {
    const lowSleep = input.sleepScore < 55;
    const lowRecovery = input.recoveryScore < 55;
    const highStress = input.stressLevel >= 65;
    const lowEnergy = input.energyLevel < 45;
    const lowFocus = input.focusLevel < 50;

    if (lowSleep || lowRecovery) {
        return missionCatalog.recovery;
    }

    if (highStress) {
        return missionCatalog.stability;
    }

    if (lowEnergy) {
        return missionCatalog.recovery;
    }

    if (lowFocus) {
        return missionCatalog.focus;
    }

    return missionCatalog.movement;
}

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
    const mission = generateDailyMission(data);
    return [mission];
}

window.HealthEngine = {
    sampleDailyCondition,
    calculateHealthScore,
    generateMissions,
    generateDailyMission
};

console.log("Health Engine loaded");