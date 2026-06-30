// =========================
// Health Pilot v0.1
// =========================

// ----- Health Score -----
const score = 89;

const scoreElement = document.getElementById("score");

if (scoreElement) {
    scoreElement.textContent = score;

    if (score >= 85) {
        scoreElement.style.color = "#34C759";
    } else if (score >= 70) {
        scoreElement.style.color = "#FF9F0A";
    } else {
        scoreElement.style.color = "#FF3B30";
    }
}

// ----- Greeting -----
const hour = new Date().getHours();

const greetingTitle = document.querySelector(".greeting h2");
const greetingText = document.querySelector(".greeting p");

if (greetingTitle && greetingText) {

    if (hour < 12) {
        greetingTitle.textContent = "☀️ おはようございます！";
        greetingText.textContent = "今日は睡眠を優先しましょう。";
    }

    else if (hour < 18) {
        greetingTitle.textContent = "🌤️ こんにちは！";
        greetingText.textContent = "午後も無理せずいきましょう。";
    }

    else {
        greetingTitle.textContent = "🌙 お疲れさまです！";
        greetingText.textContent = "今日は早めに休みましょう。";
    }
}

// ----- AI Comment -----

const comments = [

"昨日より回復が良好です。今日は早寝だけ意識すれば十分です😊",

"歩数は順調です。睡眠を優先すると健康スコア90点台が期待できます✨",

"レオピンファイブを継続できています。この調子で生活リズムを整えましょう🌿"

];

const ai = document.getElementById("ai-comment");

if (ai) {

    const index = Math.floor(Math.random() * comments.length);

    ai.innerHTML = comments[index];

}

console.log("Health Pilot Started");
