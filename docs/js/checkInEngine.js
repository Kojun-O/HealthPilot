(function (root, factory) {
  const engine = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = engine;
  }

  root.CheckInEngine = engine;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const STORAGE_KEY = 'healthPilot.dailyCheckIn';
  const DEFAULT_CHECK_IN = Object.freeze({
    date: '',
    condition: 0,
    sleep: 0,
    exercise: 0,
    mood: 0,
    stress: 0
  });

  function getTodayDate() {
    return new Date().toISOString().slice(0, 10);
  }

  function getStorage() {
    try {
      return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch (error) {
      return null;
    }
  }

  function normalizeCheckIn(value) {
    if (!value || typeof value !== 'object') {
      return { ...DEFAULT_CHECK_IN, date: getTodayDate() };
    }

    return {
      date: typeof value.date === 'string' && value.date ? value.date : getTodayDate(),
      condition: clampRating(value.condition),
      sleep: clampRating(value.sleep),
      exercise: clampRating(value.exercise),
      mood: clampRating(value.mood),
      stress: clampRating(value.stress)
    };
  }

  function clampRating(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return 0;
    }

    return Math.max(0, Math.min(5, Math.round(number)));
  }

  function loadTodayCheckIn() {
    const storage = getStorage();

    if (!storage) {
      return { ...DEFAULT_CHECK_IN, date: getTodayDate() };
    }

    clearExpiredCheckIn();

    const rawValue = storage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return { ...DEFAULT_CHECK_IN, date: getTodayDate() };
    }

    try {
      const parsed = JSON.parse(rawValue);
      const normalized = normalizeCheckIn(parsed);

      if (normalized.date !== getTodayDate()) {
        storage.removeItem(STORAGE_KEY);
        return { ...DEFAULT_CHECK_IN, date: getTodayDate() };
      }

      return normalized;
    } catch (error) {
      storage.removeItem(STORAGE_KEY);
      return { ...DEFAULT_CHECK_IN, date: getTodayDate() };
    }
  }

  function saveTodayCheckIn(values) {
    const storage = getStorage();

    if (!storage) {
      return null;
    }

    const current = loadTodayCheckIn();
    const nextValue = normalizeCheckIn({
      ...current,
      ...values,
      date: getTodayDate()
    });

    storage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
    return nextValue;
  }

  function clearExpiredCheckIn() {
    const storage = getStorage();

    if (!storage) {
      return false;
    }

    const rawValue = storage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return false;
    }

    try {
      const parsed = JSON.parse(rawValue);
      if (normalizeCheckIn(parsed).date !== getTodayDate()) {
        storage.removeItem(STORAGE_KEY);
        return true;
      }
    } catch (error) {
      storage.removeItem(STORAGE_KEY);
      return true;
    }

    return false;
  }

  return {
    STORAGE_KEY,
    loadTodayCheckIn,
    saveTodayCheckIn,
    clearExpiredCheckIn
  };
});
