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

test('generateMissionSummary reads projected delta from prediction input', () => {
  const summary = MissionEngine.generateMissionSummary(
    [{ id: 'm1', title: '22:00までに就寝', impact: 1 }],
    { projectedDelta: 5 }
  );

  assert.match(summary, /Tomorrow \+5/);
});

test('reconcileMissionSelection preserves top mission when it remains optimal', () => {
  const previousMissions = [
    { id: 'mission_a', title: 'A', priority: 90, impact: 3 },
    { id: 'mission_b', title: 'B', priority: 82, impact: 2 },
    { id: 'mission_c', title: 'C', priority: 80, impact: 2 }
  ];
  const prioritizedCandidates = [
    { id: 'mission_a', title: 'A', priority: 92, impact: 3 },
    { id: 'mission_d', title: 'D', priority: 91, impact: 3 },
    { id: 'mission_b', title: 'B', priority: 81, impact: 2 },
    { id: 'mission_e', title: 'E', priority: 78, impact: 1 }
  ];

  const reconciled = MissionEngine.reconcileMissionSelection({
    previousMissions,
    prioritizedCandidates,
    completedMissionIds: []
  });

  assert.equal(reconciled[0].id, 'mission_a');
  assert.equal(reconciled.length, 3);
});

test('reconcileMissionSelection preserves completed missions when available', () => {
  const previousMissions = [
    { id: 'mission_a', title: 'A', priority: 90, impact: 3 },
    { id: 'mission_b', title: 'B', priority: 83, impact: 2 },
    { id: 'mission_c', title: 'C', priority: 81, impact: 2 }
  ];
  const prioritizedCandidates = [
    { id: 'mission_d', title: 'D', priority: 95, impact: 4 },
    { id: 'mission_a', title: 'A', priority: 84, impact: 3 },
    { id: 'mission_b', title: 'B', priority: 72, impact: 1 },
    { id: 'mission_c', title: 'C', priority: 70, impact: 1 }
  ];

  const reconciled = MissionEngine.reconcileMissionSelection({
    previousMissions,
    prioritizedCandidates,
    completedMissionIds: ['mission_b']
  });

  assert.equal(reconciled.some((mission) => mission.id === 'mission_b'), true);
  assert.equal(reconciled.length, 3);
});
