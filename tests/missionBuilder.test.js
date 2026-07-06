const test = require('node:test');
const assert = require('node:assert/strict');

const MissionBuilder = require('../docs/js/missionBuilder.js');

test('generates exactly three mission objects sorted by recommendation priority', () => {
  const recommendations = [
    {
      id: 'trim_workload',
      priority: 3,
      objective: 'Trim workload intensity',
      reason: 'Workload pressure is high relative to current capacity.'
    },
    {
      id: 'protect_recovery',
      priority: 1,
      objective: 'Prioritize recovery',
      reason: 'Capacity is low and workload is high.'
    }
  ];

  const missions = MissionBuilder.generateMissions(recommendations);

  assert.equal(missions.length, 3);
  assert.deepEqual(
    missions.map((mission) => mission.priority),
    [1, 3, 102]
  );

  assert.ok(missions.every((mission) => {
    return Object.keys(mission).sort().join(',') === 'category,description,icon,id,priority,title';
  }));

  assert.ok(missions.every((mission) => {
    return MissionBuilder.ALLOWED_CATEGORIES.includes(mission.category);
  }));

  assert.ok(missions.every((mission) => {
    return typeof mission.title === 'string' && mission.title.length > 0;
  }));

  assert.ok(missions.every((mission) => {
    return typeof mission.description === 'string' && mission.description.length > 0;
  }));
});

test('fills from fallback templates when recommendations are fewer than three', () => {
  const missions = MissionBuilder.generateMissions([]);

  assert.equal(missions.length, 3);
  assert.equal(missions[0].category, 'Sleep');
  assert.equal(missions[0].title, '22:00までに就寝');
  assert.equal(missions[1].category, 'Recovery');
  assert.equal(missions[2].category, 'Activity');
});

test('generates mission summary from first mission without recommendation text', () => {
  const missions = [
    {
      id: 'sleep_2200_custom',
      title: '22:00までに就寝',
      description: '回復のため、今日は22時までに休みましょう。',
      category: 'Sleep',
      icon: '◌',
      priority: 1
    }
  ];

  const summary = MissionBuilder.generateMissionSummary(missions);

  assert.ok(summary.includes('今日は睡眠を優先しましょう。'));
  assert.ok(summary.includes('まずは「22:00までに就寝」から始めるのがおすすめです。'));
  assert.equal(summary.includes('Capacity is low'), false);
});
