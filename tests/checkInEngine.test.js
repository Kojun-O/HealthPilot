const test = require('node:test');
const assert = require('node:assert/strict');

const { loadTodayCheckIn, saveTodayCheckIn, clearExpiredCheckIn } = require('../docs/js/checkInEngine.js');

function createMemoryStorage() {
  const store = new Map();

  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index) {
      return Array.from(store.keys())[index] || null;
    },
    get length() {
      return store.size;
    }
  };
}

test('loads an empty check-in for today when nothing is stored', () => {
  globalThis.localStorage = createMemoryStorage();

  const checkIn = loadTodayCheckIn();

  assert.deepEqual(checkIn, {
    date: new Date().toISOString().slice(0, 10),
    condition: 0,
    sleep: 0,
    exercise: 0,
    mood: 0,
    stress: 0
  });
});

test('saves and restores todays ratings', () => {
  globalThis.localStorage = createMemoryStorage();

  saveTodayCheckIn({ condition: 4, sleep: 2, exercise: 5, mood: 3, stress: 1 });
  const checkIn = loadTodayCheckIn();

  assert.equal(checkIn.condition, 4);
  assert.equal(checkIn.sleep, 2);
  assert.equal(checkIn.exercise, 5);
  assert.equal(checkIn.mood, 3);
  assert.equal(checkIn.stress, 1);
  assert.equal(checkIn.date, new Date().toISOString().slice(0, 10));
});

test('clears stale check-ins for a previous day', () => {
  globalThis.localStorage = createMemoryStorage();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  globalThis.localStorage.setItem('healthPilot.dailyCheckIn', JSON.stringify({
    date: yesterday.toISOString().slice(0, 10),
    condition: 3,
    sleep: 4,
    exercise: 2,
    mood: 5,
    stress: 1
  }));

  clearExpiredCheckIn();

  assert.equal(globalThis.localStorage.getItem('healthPilot.dailyCheckIn'), null);
  const restored = loadTodayCheckIn();
  assert.equal(restored.condition, 0);
});
