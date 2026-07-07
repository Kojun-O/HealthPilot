const test = require('node:test');
const assert = require('node:assert/strict');

const ContextEngine = require('../docs/js/contextEngine.js');

test('buildContext returns deterministic schema from today data', () => {
  const context = ContextEngine.buildContext({
    sleepScore: 42,
    recoveryScore: 48,
    stressLevel: 72,
    energyLevel: 38,
    capacity: { capacity: 41 },
    dailyContext: { timeOfDay: 'morning' }
  });

  assert.deepEqual(context, {
    recovery: 'low',
    stress: 'high',
    sleepDebt: true,
    focusDemand: 'medium',
    energy: 'low',
    confidence: 0.8,
    primaryLeverage: 'sleep',
    recommendationMode: 'balanced'
  });
});

test('evening context switches mission mode toward recovery actions', () => {
  const context = ContextEngine.buildContext({
    sleepScore: 70,
    recoveryScore: 68,
    stressLevel: 40,
    energyLevel: 66,
    capacity: { capacity: 68 },
    dailyContext: { timeOfDay: 'evening' }
  });

  assert.equal(context.focusDemand, 'low');
  assert.equal(context.recommendationMode, 'recovery');
});

test('high stress check-in elevates stress context', () => {
  const context = ContextEngine.buildContext({
    sleepScore: 72,
    recoveryScore: 70,
    stressLevel: 45,
    energyLevel: 66,
    checkIn: { stress: 5 },
    dailyContext: { timeOfDay: 'morning' }
  });

  assert.equal(context.stress, 'high');
});

test('condition and sleep check-in can improve recovery context', () => {
  const withoutCheckIn = ContextEngine.buildContext({
    sleepScore: 50,
    recoveryScore: 52,
    stressLevel: 45,
    energyLevel: 55,
    capacity: { capacity: 52 },
    dailyContext: { timeOfDay: 'morning' }
  });

  const withPositiveCheckIn = ContextEngine.buildContext({
    sleepScore: 50,
    recoveryScore: 52,
    stressLevel: 45,
    energyLevel: 55,
    capacity: { capacity: 52 },
    checkIn: { condition: 5, sleep: 5, exercise: 4, mood: 4, stress: 1 },
    dailyContext: { timeOfDay: 'morning' }
  });

  assert.equal(withoutCheckIn.recovery, 'low');
  assert.equal(withPositiveCheckIn.recovery, 'high');
});
