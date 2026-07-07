const test = require('node:test');
const assert = require('node:assert/strict');

const MissionEngine = require('../docs/js/missionEngine.js');

test('buildMissionPlan consumes context to prioritize sleep/recovery when debt exists', () => {
  const recommendations = [
    {
      id: 'reduce_stress_load',
      priority: 1,
      objective: 'Reduce stress load',
      reason: 'Stress is high'
    },
    {
      id: 'protect_recovery',
      priority: 2,
      objective: 'Prioritize recovery',
      reason: 'Recovery reserve is low'
    }
  ];

  const missionPlan = MissionEngine.buildMissionPlan({
    recommendations,
    context: {
      recovery: 'low',
      stress: 'high',
      sleepDebt: true,
      focusDemand: 'medium',
      energy: 'low',
      confidence: 0.8,
      primaryLeverage: 'sleep'
    }
  });

  assert.ok(Array.isArray(missionPlan.topMissions));
  assert.equal(missionPlan.topMissions.length, 3);
  assert.equal(missionPlan.topMissions[0].category, 'Sleep');
  assert.match(missionPlan.why, /睡眠|回復/);
});

test('falls back safely when recommendations are missing', () => {
  const missionPlan = MissionEngine.buildMissionPlan({
    context: {
      stress: 'medium',
      energy: 'medium',
      confidence: 0.7,
      primaryLeverage: 'consistency'
    }
  });

  assert.ok(Array.isArray(missionPlan.topMissions));
  assert.ok(missionPlan.topMissions.length >= 1);
  assert.equal(missionPlan.topMissions[0].id.includes('fallback'), true);
});
