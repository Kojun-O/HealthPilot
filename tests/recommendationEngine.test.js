const test = require('node:test');
const assert = require('node:assert/strict');

const HealthInsights = require('../docs/js/healthInsights.js');
const RecommendationEngine = require('../docs/js/recommendationEngine.js');

test('converts health insights into recommendations', () => {
  const insights = HealthInsights.generateHealthInsights({
    signals: {
      sleepScore: 58,
      recoveryScore: 44,
      stressLevel: 74,
      activityScore: 62,
      moodScore: 66,
      focusLevel: 52,
      hydrationScore: 61
    }
  });

  const recommendations = RecommendationEngine.generateRecommendations(insights);

  assert.deepEqual(
    recommendations.map((recommendation) => recommendation.priority),
    ['recovery_priority', 'sleep_priority', 'stress_reduction']
  );

  assert.equal(recommendations[0].id, 'recovery_priority');
  assert.match(recommendations[0].reason, /Recovery|Energy/i);
  assert.ok(Array.isArray(recommendations[0].sourceInsights));
  assert.ok(recommendations[0].score > 0);
});

test('creates a balance recommendation from a balanced day insight', () => {
  const recommendations = RecommendationEngine.generateRecommendations([
    {
      id: 'balanced_day',
      label: 'Balanced day',
      severity: 'low',
      reason: 'Core health signals are in a stable range across sleep, recovery, stress, activity, mood, and focus.',
      relatedSignals: ['sleepScore', 'recoveryScore', 'stressLevel', 'activityScore', 'moodScore', 'focusLevel']
    }
  ]);

  assert.deepEqual(recommendations, [
    {
      id: 'balance_priority',
      priority: 'balance_priority',
      score: 60,
      reason: 'Core health signals are in a stable range across sleep, recovery, stress, activity, mood, and focus.',
      sourceInsights: [
        {
          id: 'balanced_day',
          label: 'Balanced day',
          severity: 'low',
          reason: 'Core health signals are in a stable range across sleep, recovery, stress, activity, mood, and focus.',
          relatedSignals: ['sleepScore', 'recoveryScore', 'stressLevel', 'activityScore', 'moodScore', 'focusLevel']
        }
      ]
    }
  ]);
});