const test = require('node:test');
const assert = require('node:assert/strict');

const RecommendationEngine = require('../docs/js/recommendationEngine.js');
const CapacityCalculator = require('../docs/js/capacityCalculator.js');

test('generates structured recommendations from capacity output and daily context', () => {
  const capacity = CapacityCalculator.calculateCapacity({
    sleepScore: 42,
    recoveryScore: 48,
    activityScore: 38,
    stressScore: 72,
    workloadLevel: 68,
    painLevel: 24
  });

  const recommendations = RecommendationEngine.generateRecommendations(capacity, {
    timeOfDay: 'morning',
    weekday: 1,
    recentCompletionRate: 67,
    streakDays: 3
  });

  assert.deepEqual(
    recommendations.map((recommendation) => recommendation.id),
    ['protect_recovery', 'reduce_stress_load', 'trim_workload']
  );

  assert.deepEqual(recommendations[0], {
    id: 'protect_recovery',
    priority: 1,
    objective: 'Prioritize recovery',
    reason: 'Capacity is low and workload is high.'
  });

  assert.ok(recommendations.every((recommendation) => {
    return Object.keys(recommendation).sort().join(',') === 'id,objective,priority,reason';
  }));
});

test('uses mock daily context defaults and returns max three sorted by priority', () => {
  const recommendations = RecommendationEngine.generateRecommendations({
    capacity: 40,
    status: 'Take it easy',
    factors: [
      { name: 'Stress', impact: -7 },
      { name: 'Workload', impact: -5 },
      { name: 'Recovery', impact: -3 },
      { name: 'Activity', impact: -2 }
    ]
  });

  assert.deepEqual(recommendations, [
    {
      id: 'protect_recovery',
      priority: 1,
      objective: 'Prioritize recovery',
      reason: 'Capacity is low and workload is high.'
    },
    {
      id: 'reduce_stress_load',
      priority: 2,
      objective: 'Reduce stress load',
      reason: 'Stress impact is reducing available capacity today.'
    },
    {
      id: 'trim_workload',
      priority: 3,
      objective: 'Trim workload intensity',
      reason: 'Workload pressure is high relative to current capacity.'
    }
  ]);

  assert.equal(recommendations.length, 3);
  assert.ok(recommendations[0].priority <= recommendations[1].priority);
  assert.ok(recommendations[1].priority <= recommendations[2].priority);
});

test('reprioritizes recommendations when daily context mentions working late', () => {
  const capacityOutput = {
    capacity: 62,
    status: 'Balanced',
    factors: [
      { name: 'Stress', impact: -6 },
      { name: 'Workload', impact: -5 }
    ]
  };

  const baseline = RecommendationEngine.generateRecommendations(capacityOutput, {
    timeOfDay: 'morning',
    weekday: 2,
    recentCompletionRate: 40,
    streakDays: 1,
    note: ''
  });

  const withContext = RecommendationEngine.generateRecommendations(capacityOutput, {
    timeOfDay: 'morning',
    weekday: 2,
    recentCompletionRate: 40,
    streakDays: 1,
    note: 'Working late tonight.'
  });

  assert.deepEqual(
    baseline.map((recommendation) => recommendation.id),
    ['reduce_stress_load', 'trim_workload']
  );

  assert.deepEqual(
    withContext.map((recommendation) => recommendation.id),
    ['trim_workload', 'reduce_stress_load']
  );

  assert.deepEqual(
    withContext.map((recommendation) => recommendation.priority),
    [1, 2]
  );
});

test('empty daily context preserves baseline recommendation behavior', () => {
  const capacityOutput = {
    capacity: 62,
    status: 'Balanced',
    factors: [
      { name: 'Stress', impact: -6 },
      { name: 'Workload', impact: -5 }
    ]
  };

  const withoutContext = RecommendationEngine.generateRecommendations(capacityOutput);
  const withEmptyContext = RecommendationEngine.generateRecommendations(capacityOutput, {
    category: '',
    note: '   '
  });

  assert.deepEqual(withEmptyContext, withoutContext);
});