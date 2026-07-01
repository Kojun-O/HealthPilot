// ======================================
// Health Pilot
// Built-in AI
// ======================================

function generateAdvice(context) {

    const score = context.healthScore;

    if (score >= 90) {
        return "🌿 今日のコンディションはとても良好です。この生活リズムを維持しましょう。";
    }

    if (score >= 80) {
        return "😊 全体的に良い状態です。今日のMissionを達成するとさらに良くなります。";
    }

    if (score >= 70) {
        return "😴 少し疲れが見られます。今日は睡眠を最優先にしましょう。";
    }

    return "💙 回復を優先する日です。無理をせず、早めの就寝をおすすめします。";

}

window.BuiltInAI = {

    generateAdvice

};

console.log("Built-in AI loaded");