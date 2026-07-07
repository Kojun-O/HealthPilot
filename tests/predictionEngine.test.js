const test = require('node:test');
const assert = require('node:assert/strict');

const PredictionEngine = require('../docs/js/predictionEngine.js');

test('calculateTomorrowCapacity returns prediction schema fields', () => {
  const prediction = PredictionEngine.calculateTomorrowCapacity({
    currentCapacity: 68,
    missions: [
      { id: 'm1', impact: 2 },
      { id: 'm2', impact: 1 },
      { id: 'm3', impact: 3 }
    ],
    missionCompletion: {
      completionRate: 0.5
    }
  });

  assert.equal(prediction.currentCapacity, 68);
  assert.equal(typeof prediction.projectedCapacity, 'number');
  assert.equal(typeof prediction.projectedDelta, 'number');
  assert.ok('missionImpact' in prediction);
});

test('completed mission ids contribute to projected delta from mission impact', () => {
  const prediction = PredictionEngine.calculateTomorrowCapacity({
    currentCapacity: 60,
    missions: [
      { id: 'sleep', impact: 3 },
      { id: 'stress', impact: 2 },
      { id: 'focus', impact: 1 }
    ],
    missionCompletion: {
      completedMissionIds: ['sleep', 'focus']
    }
  });

  assert.equal(prediction.projectedDelta, 4);
  assert.equal(prediction.projectedCapacity, 64);
});

test('capacity values are clamped safely', () => {
  const prediction = PredictionEngine.calculateTomorrowCapacity({
    currentCapacity: 99,
    missions: [{ id: 'high', impact: 8 }],
    missionCompletion: {
      completionRate: 1
    }
  });

  assert.equal(prediction.projectedDelta, 8);
  assert.equal(prediction.projectedCapacity, 100);
});