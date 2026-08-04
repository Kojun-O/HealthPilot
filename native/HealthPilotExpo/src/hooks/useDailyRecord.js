import { useCallback, useEffect, useMemo, useState } from "react";
import { getMissionStableId, getMissionStableIds } from "../ai/missionStableId.js";
import { buildMorningOutcome, shouldPersistMorningOutcomeLink } from "./morningOutcomeLinking.js";
import {
  getNextSelectedMissionIds,
  resolveDisplayedMissions,
  resolveDailyMissions,
} from "./dailyMissionSelection.js";
import { resolveRolloverDateKey } from "../storage/dailyRecordModel.js";
import {
  getNextDateKey,
  getPreviousDateKey,
  getTodayDateKey,
  loadDailyRecord,
  saveDailyRecord,
} from "../storage/dailyRecordStorage.js";

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

function toPresentedMissions(missions) {
  if (!Array.isArray(missions)) {
    return [];
  }

  return missions
    .map((mission) => {
      const id = getMissionStableId(mission);
      const title = typeof mission?.title === "string" ? mission.title.trim() : "";

      if (!id || !title) {
        return null;
      }

      const expectedImpact = Number(mission?.expectedImpact);

      return {
        id,
        title,
        expectedImpact: Number.isFinite(expectedImpact) ? Math.max(0, Math.round(expectedImpact)) : 0,
      };
    })
    .filter(Boolean);
}

function isMissionLockDebugEnabled() {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

function toPresentedMissionIds(presentedMissions) {
  if (!Array.isArray(presentedMissions)) {
    return [];
  }

  return presentedMissions
    .map((mission) => (typeof mission?.id === "string" ? mission.id.trim() : ""))
    .filter(Boolean);
}

export function useDailyRecord({ missions, baselineTomorrow, actualCapacity }) {
  const [checkInRatings, setCheckInRatings] = useState(DEFAULT_CHECK_IN_RATINGS);
  const [checkInNoteText, setCheckInNoteText] = useState("");
  const [missionCompletionSource, setMissionCompletionSource] = useState({});
  const [persistedPresentedMissions, setPersistedPresentedMissions] = useState([]);
  const [healthSnapshot, setHealthSnapshot] = useState(null);
  const [selectedMissionIds, setSelectedMissionIds] = useState([]);
  const [hasUserCheckInInput, setHasUserCheckInInput] = useState(false);
  const [currentDateKey, setCurrentDateKey] = useState(getTodayDateKey());
  const [isHydrated, setIsHydrated] = useState(false);
  const [missionLockDebugState, setMissionLockDebugState] = useState(null);

  const resolvedMissions = useMemo(() => {
    return resolveDailyMissions({
      liveMissions: missions,
      selectedMissionIds,
      persistedPresentedMissions,
    });
  }, [missions, persistedPresentedMissions, selectedMissionIds]);
  const displayedMissions = useMemo(() => {
    return resolveDisplayedMissions({
      isHydrated,
      resolvedMissions,
    });
  }, [isHydrated, resolvedMissions]);
  const presentedMissions = useMemo(() => toPresentedMissions(displayedMissions), [displayedMissions]);
  const missionCompletion = useMemo(
    () => buildMissionCompletionMap(displayedMissions, missionCompletionSource),
    [displayedMissions, missionCompletionSource],
  );
  const completedImpact = useMemo(() => {
    return displayedMissions.reduce((sum, mission) => {
      const missionId = getMissionStableId(mission);

      if (!missionId || !missionCompletion[missionId]) {
        return sum;
      }

      const impact = Number(mission.expectedImpact);
      return sum + (Number.isFinite(impact) ? Math.round(impact) : 0);
    }, 0);
  }, [displayedMissions, missionCompletion]);
  const projectedTomorrow = useMemo(() => {
    const baseline = Number.isFinite(Number(baselineTomorrow)) ? Math.round(Number(baselineTomorrow)) : 0;
    return Math.min(100, Math.max(0, baseline + completedImpact));
  }, [baselineTomorrow, completedImpact]);
  const tomorrowCapacityPrediction = useMemo(() => {
    const baseline = Number.isFinite(Number(baselineTomorrow)) ? Math.round(Number(baselineTomorrow)) : 0;
    const targetDate = getNextDateKey(currentDateKey);

    return {
      baseline,
      projected: projectedTomorrow,
      completedImpact,
      delta: projectedTomorrow - baseline,
      targetDate,
    };
  }, [baselineTomorrow, completedImpact, currentDateKey, projectedTomorrow]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentDateKey((previousDateKey) => {
        return resolveRolloverDateKey(previousDateKey, new Date());
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
      setHasUserCheckInInput(false);
      const record = await loadDailyRecord(currentDateKey);

      if (isMissionLockDebugEnabled()) {
        const hydratedRecordDebug = {
          selectedMissionIds: Array.isArray(record?.selectedMissionIds) ? record.selectedMissionIds : [],
          presentedMissionIds: toPresentedMissionIds(record?.presentedMissions),
          missionCompletion: record?.missionCompletion ?? {},
        };

        console.log("[MissionLockHydrate]", {
          currentDateKey,
          ...hydratedRecordDebug,
        });

        setMissionLockDebugState((previous) => ({
          ...(previous || {}),
          currentDateKey,
          hydratedRecord: hydratedRecordDebug,
        }));
      }

      if (cancelled) {
        return;
      }

      setCheckInRatings(normalizeCheckInRatings(record?.checkIn ?? DEFAULT_CHECK_IN_RATINGS));
      setCheckInNoteText(typeof record?.checkInNote?.text === "string" ? record.checkInNote.text : "");
      setMissionCompletionSource(record?.missionCompletion ?? {});
      setPersistedPresentedMissions(Array.isArray(record?.presentedMissions) ? record.presentedMissions : []);
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
    const liveMissionIds = getMissionStableIds(missions);
    const persistedPresentedMissionIds = toPresentedMissionIds(persistedPresentedMissions);
    const resolvedMissionIds = getMissionStableIds(resolvedMissions);
    const nextSelectedMissionIds = getNextSelectedMissionIds({
      isHydrated,
      currentSelectedMissionIds: selectedMissionIds,
      resolvedMissions,
    });

    if (isMissionLockDebugEnabled()) {
      console.log("[MissionLockDebug]", {
        currentDateKey,
        isHydrated,
        selectedMissionIds,
        liveMissionIds,
        persistedPresentedMissionIds,
        resolvedMissionIds,
        missionCompletionSource,
        nextSelectedMissionIds,
      });

      setMissionLockDebugState((previous) => ({
        ...(previous || {}),
        currentDateKey,
        isHydrated,
        selectedMissionIds,
        liveMissionIds,
        persistedPresentedMissionIds,
        resolvedMissionIds,
        missionCompletionSource,
        nextSelectedMissionIds,
      }));
    }

    if (!nextSelectedMissionIds) {
      return;
    }

    if (isMissionLockDebugEnabled()) {
      const selectionUpdateDebug = {
        before: selectedMissionIds,
        after: nextSelectedMissionIds,
      };

      console.log("[MissionLockDebug] selectedMissionIds update", {
        currentDateKey,
        ...selectionUpdateDebug,
      });

      setMissionLockDebugState((previous) => ({
        ...(previous || {}),
        currentDateKey,
        lastSelectionUpdate: selectionUpdateDebug,
      }));
    }

    setSelectedMissionIds(nextSelectedMissionIds);
  }, [
    currentDateKey,
    isHydrated,
    missionCompletionSource,
    missions,
    persistedPresentedMissions,
    resolvedMissions,
    selectedMissionIds,
  ]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    let cancelled = false;

    async function persistDailyRecord() {
      if (isMissionLockDebugEnabled()) {
        const persistDebug = {
          selectedMissionIds,
          presentedMissionIds: toPresentedMissionIds(presentedMissions),
          missionCompletion,
        };

        console.log("[MissionLockPersist]", {
          currentDateKey,
          ...persistDebug,
        });

        setMissionLockDebugState((previous) => ({
          ...(previous || {}),
          currentDateKey,
          lastPersist: persistDebug,
        }));
      }

      await saveDailyRecord(currentDateKey, {
        date: currentDateKey,
        healthSnapshot,
        checkIn: checkInRatings,
        checkInNote: checkInNoteText,
        presentedMissions,
        selectedMissionIds,
        missionCompletion,
        tomorrowCapacityPrediction,
      });

      const previousDateKey = getPreviousDateKey(currentDateKey);
      const previousRecord = await loadDailyRecord(previousDateKey);

      if (
        cancelled
        || !shouldPersistMorningOutcomeLink({ previousRecord, currentDateKey, hasUserCheckInInput })
      ) {
        return;
      }

      const morningOutcome = buildMorningOutcome({
        currentDateKey,
        checkInRatings,
        actualCapacity,
        previousRecord,
      });

      if (!morningOutcome) {
        return;
      }

      await saveDailyRecord(previousDateKey, {
        ...previousRecord,
        morningOutcome,
      });
    }

    persistDailyRecord();

    return () => {
      cancelled = true;
    };
  }, [
    checkInRatings,
    checkInNoteText,
    actualCapacity,
    currentDateKey,
    healthSnapshot,
    isHydrated,
    missionCompletion,
    presentedMissions,
    selectedMissionIds,
    hasUserCheckInInput,
    tomorrowCapacityPrediction,
  ]);

  const updateCheckInRating = useCallback((key, value) => {
    setHasUserCheckInInput(true);
    setCheckInRatings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }, []);

  const updateCheckInNoteText = useCallback((value) => {
    setCheckInNoteText(typeof value === "string" ? value : "");
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
    checkInNoteText,
    currentDateKey,
    completedImpact,
    healthSnapshot,
    isHydrated,
    isMissionCompleted,
    missionLockDebugState,
    missions: displayedMissions,
    projectedTomorrow,
    setHealthSnapshot,
    toggleMissionCompletion,
    updateCheckInRating,
    updateCheckInNoteText,
  };
}