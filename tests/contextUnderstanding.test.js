const test = require('node:test');
const assert = require('node:assert/strict');

const ContextUnderstanding = require('../docs/js/contextUnderstanding.js');

test('returns default structured output for empty context', () => {
  const structured = ContextUnderstanding.analyzeContext({ note: '   ' });

  assert.deepEqual(structured, {
    physical: {
      pain: false,
      painAreas: [],
      fatigue: false,
      headache: false,
      coldSymptoms: false
    },
    work: {
      workload: 'normal',
      importantEvent: false,
      eventType: 'none',
      overtimeRisk: false,
      businessTrip: false,
      deadlineRisk: false
    },
    mental: {
      stressRisk: 'low',
      motivation: 'unknown',
      stressed: false,
      anxious: false,
      calm: false
    },
    personal: {
      familyEvent: false,
      childCare: false,
      travel: false
    },
    constraints: [],
    priorities: []
  });
});

test('detects japanese ankle pain plus work pressure signals', () => {
  const structured = ContextUnderstanding.analyzeContext({
    note: '明日プレゼンがあります。今日は残業になりそうです。足首も少し痛いです。',
    date: '2026-07-06'
  });

  assert.equal(structured.physical.pain, true);
  assert.deepEqual(structured.physical.painAreas, ['ankle']);
  assert.equal(structured.work.importantEvent, true);
  assert.equal(structured.work.eventType, 'presentation');
  assert.equal(structured.work.overtimeRisk, true);
  assert.equal(structured.work.workload, 'high');
  assert.ok(structured.constraints.includes('avoid_high_intensity_activity'));
  assert.ok(structured.priorities.includes('focus_protection'));
  assert.ok(structured.priorities.includes('recovery_support'));
});

test('detects english fatigue cold and deadline intent', () => {
  const structured = ContextUnderstanding.analyzeContext({
    note: 'I feel tired with a cough and fever. Big deadline tomorrow.',
    date: '2026-07-06'
  });

  assert.equal(structured.physical.fatigue, true);
  assert.equal(structured.physical.coldSymptoms, true);
  assert.equal(structured.work.deadlineRisk, true);
  assert.equal(structured.work.workload, 'high');
  assert.equal(structured.work.eventType, 'deadline');
  assert.ok(structured.priorities.includes('focus_protection'));
  assert.ok(structured.priorities.includes('recovery_support'));
});

test('detects personal and travel related constraints', () => {
  const structured = ContextUnderstanding.analyzeContext({
    note: 'Family event this weekend and child care before a business trip.',
    date: '2026-07-06'
  });

  assert.equal(structured.personal.familyEvent, true);
  assert.equal(structured.personal.childCare, true);
  assert.equal(structured.personal.travel, true);
  assert.equal(structured.work.businessTrip, true);
});
