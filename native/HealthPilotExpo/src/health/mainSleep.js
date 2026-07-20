const SLEEP_SESSION_MIN_HOURS = 3;
const SLEEP_SESSION_GAP_MS = 90 * 60 * 1000;

function toDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function normalizeInterval(interval) {
  const start = toDate(interval?.start);
  const end = toDate(interval?.end);

  if (!start || !end || end <= start) {
    return null;
  }

  return { start, end };
}

function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((left, right) => left.start - right.start);
  const merged = [];

  for (const interval of sorted) {
    const previous = merged[merged.length - 1];

    if (!previous) {
      merged.push({ ...interval });
      continue;
    }

    if (interval.start <= previous.end) {
      previous.end = new Date(Math.max(previous.end.getTime(), interval.end.getTime()));
      continue;
    }

    merged.push({ ...interval });
  }

  return merged;
}

function collapseSleepSessions(intervals) {
  const merged = mergeIntervals(intervals);
  const sessions = [];

  for (const interval of merged) {
    const previous = sessions[sessions.length - 1];

    if (!previous) {
      sessions.push({ ...interval });
      continue;
    }

    if (interval.start.getTime() - previous.end.getTime() <= SLEEP_SESSION_GAP_MS) {
      previous.end = interval.end;
      continue;
    }

    sessions.push({ ...interval });
  }

  return sessions;
}

function getDurationMinutes(interval) {
  return Math.round((interval.end.getTime() - interval.start.getTime()) / (60 * 1000));
}

function toMainSleep(interval) {
  if (!interval) {
    return null;
  }

  return {
    startAt: interval.start.toISOString(),
    endAt: interval.end.toISOString(),
    durationMinutes: getDurationMinutes(interval),
  };
}

export function pickMainSleep(intervals = []) {
  const normalizedIntervals = intervals.map(normalizeInterval).filter(Boolean);

  if (normalizedIntervals.length === 0) {
    return null;
  }

  const sessions = collapseSleepSessions(normalizedIntervals);
  const qualifyingSessions = sessions.filter(
    (session) => getDurationMinutes(session) >= SLEEP_SESSION_MIN_HOURS * 60,
  );
  const candidates = qualifyingSessions.length > 0 ? qualifyingSessions : sessions;
  const mainSleep = candidates[candidates.length - 1];

  return toMainSleep(mainSleep);
}