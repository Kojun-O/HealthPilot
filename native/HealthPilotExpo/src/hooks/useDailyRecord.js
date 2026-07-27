import { useCallback, useEffect, useMemo, useState } from "react";
import { getMissionStableId, getMissionStableIds } from "../ai/missionStableId";
import { getTodayDateKey, loadDailyRecord, saveDailyRecord } from "../storage/dailyRecordStorage";

const DEFAULT_CHECK_IN_RATINGS = Object.freeze({
  condition: 3,
  sleep: 3,
  focus: 3,
  mentalSpace: 3,
  activity: 3,
});

function clampCheckInValue(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return 3;
  }

  return Math.max(1, Math.min(5, Math.round(numeric)));
}

function normalizeCheckInRatings(value) {
  const source = value && typeof value === "object" ? value : {};

  return {
    condition: clampCheckInValue(source.condition),
    sleep: clampCheckInValue(source.sleep),
    focus: clampCheckInValue(source.focus),
    mentalSpace: clampCheckInValue(source.mentalSpace),
    activity: clampCheckInValue(source.activity),
  };
}

function buildMissionCompletionMap(missions, sourceCompletion) {
  const safeSource = sourceCompletion && typeof sourceCompletion === "object" ? sourceCompletion : {};

  return (Array.isArray(missions) ? missions : []).reduce((result, mission) => {
    const missionId = getMissionStableId(mission);

    if (!missionId) {
      return result;
    }

    result[missionId] = Boolean(safeSource[missionId]);
    return result;
  }, {});
}

export function useDailyRecord({ missions, baselineTomorrow }) {
  const [checkInRatings, setCheckInRatings] = useState(DEFAULT_CHECK_IN_RATINGS);
  const [missionCompletionSource, setMissionCompletionSource] = useState({});
  const [healthSnapshot, setHealthSnapshot] = useState(null);
  const [selectedMissionIds, setSelectedMissionIds] = useState([]);
  const [currentDateKey, setCurrentDateKey] = useState(getTodayDateKey());
  const [isHydrated, setIsHydrated] = useState(false);

  const stableMissionIds = useMemo(() => getMissionStableIds(missions), [missions]);
  const missionCompletion = useMemo(
    () => buildMissionCompletionMap(missions, missionCompletionSource),
    [missionCompletionSource, missions],
  );
  const completedImpact = useMemo(() => {
    return (Array.isArray(missions) ? missions : []).reduce((sum, mission) => {
      const missionId = getMissionStableId(mission);

      if (!missionId || !missionCompletion[missionId]) {
        return sum;
      }

      const impact = Number(mission.expectedImpact);
      return sum + (Number.isFinite(impact) ? Math.round(impact) : 0);
    }, 0);
  }, [missionCompletion, missions]);
  const projectedTomorrow = useMemo(() => {
    const baseline = Number.isFinite(Number(baselineTomorrow)) ? Math.round(Number(baselineTomorrow)) : 0;
    return Math.min(100, Math.max(0, baseline + completedImpact));
  }, [baselineTomorrow, completedImpact]);
  const tomorrowCapacityPrediction = useMemo(() => {
    const baseline = Number.isFinite(Number(baselineTomorrow)) ? Math.round(Number(baselineTomorrow)) : 0;

    return {
      baseline,
      projected: projectedTomorrow,
      completedImpact,
      delta: projectedTomorrow - baseline,
    };
  }, [baselineTomorrow, completedImpact, projectedTomorrow]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const today = getTodayDateKey();

      setCurrentDateKey((previousDateKey) => {
        if (previousDateKey === today) {
          return previousDateKey;
        }

        return today;
      });
    }, 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDailyRecord() {
      setIsHydrated(false);
      const record = await loadDailyRecord(currentDateKey);

      if (cancelled) {
        return;
      }

      setCheckInRatings(normalizeCheckInRatings(record?.checkIn ?? DEFAULT_CHECK_IN_RATINGS));
      setMissionCompletionSource(record?.missionCompletion ?? {});
      setSelectedMissionIds(Array.isArray(record?.selectedMissionIds) ? record.selectedMissionIds : []);
      setHealthSnapshot(record?.healthSnapshot ?? null);
      setIsHydrated(true);
    }

    hydrateDailyRecord();

    return () => {
      cancelled = true;
    };
  }, [currentDateKey]);

  useEffect(() => {
    if (!stableMissionIds.length) {
      return;
    }

    setSelectedMissionIds(stableMissionIds);
  }, [stableMissionIds]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveDailyRecord(currentDateKey, {
      date: currentDateKey,
      healthSnapshot,
      checkIn: checkInRatings,
      selectedMissionIds,
      missionCompletion,
      tomorrowCapacityPrediction,
    });
  }, [
    checkInRatings,
    currentDateKey,
    healthSnapshot,
    isHydrated,
    missionCompletion,
    selectedMissionIds,
    tomorrowCapacityPrediction,
  ]);

  const updateCheckInRating = useCallback((key, value) => {
    setCheckInRatings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }, []);

  const toggleMissionCompletion = useCallback((mission) => {
    const missionId = getMissionStableId(mission);

    if (!missionId) {
      console.warn("Mission stable ID is missing. Add definitionId or id to mission.", mission);
      return;
    }

    setMissionCompletionSource((previous) => ({
      ...previous,
      [missionId]: !previous[missionId],
    }));
  }, []);

  const isMissionCompleted = useCallback((mission) => {
    const missionId = getMissionStableId(mission);

    if (!missionId) {
      return false;
    }

    return Boolean(missionCompletion[missionId]);
  }, [missionCompletion]);

  return {
    checkInRatings,
    currentDateKey,
    completedImpact,
    healthSnapshot,
    isHydrated,
    isMissionCompleted,
    projectedTomorrow,
    setHealthSnapshot,
    toggleMissionCompletion,
    updateCheckInRating,
  };
}