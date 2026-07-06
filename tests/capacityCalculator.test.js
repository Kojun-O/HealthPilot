const test = require('node:test');
const assert = require('node:assert/strict');

const CapacityCalculator = require('../docs/js/capacityCalculator.js');

test('calculates capacity, status, and top factors from health inputs', () => {
  const result = CapacityCalculator.calculateCapacity({
    sleepScore: 42,
    recoveryScore: 48,
    activityScore: 38,
    stressScore: 72,
    workloadLevel: 68,
    painLevel: 24
  });

  assert.deepEqual(result, {
    capacity: 43,
    status: 'Take it easy',
    factors: [
      { name: 'Stress', impact: -6 },
      { name: 'Pain', impact: 4 },
      { name: 'Workload', impact: -4 },
      { name: 'Activity', impact: -2 }
    ]
  });
});

test('clamps capacity within the valid range', () => {
  const result = CapacityCalculator.calculateCapacity({
    sleepScore: 100,
    recoveryScore: 100,
    activityScore: 100,
    stressScore: 0,
    workloadLevel: 0,
    painLevel: 0
  });

  assert.equal(result.capacity, 100);
  assert.equal(result.status, 'Excellent');
});