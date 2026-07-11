import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { generateHealthPilotInsight } from "./src/ai/engine";
import { buildAiInput } from "./src/ai/mockInput";

const CHECK_IN_ITEMS = [
  { key: "condition", icon: "❤️", label: "体調" },
  { key: "sleep", icon: "🛏️", label: "睡眠" },
  { key: "focus", icon: "🎯", label: "集中力" },
  { key: "mentalSpace", icon: "🍃", label: "心の余裕" },
  { key: "activity", icon: "🚶", label: "活動量" },
];

export default function App() {
  const [insight, setInsight] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [completedMissions, setCompletedMissions] = useState({});
  const [checkInRatings, setCheckInRatings] = useState({
    condition: 3,
    sleep: 3,
    focus: 3,
    mentalSpace: 3,
    activity: 3,
  });

  const formatLocalTime = useCallback((date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
  }, []);

  const loadInsight = useCallback(async () => {
    const { input } = await buildAiInput();
    return generateHealthPilotInsight(input);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialInsight() {
      const result = await loadInsight();

      if (cancelled) {
        return;
      }

      setInsight(result);
      setLastUpdatedAt(new Date());
    }

    loadInitialInsight();

    return () => {
      cancelled = true;
    };
  }, [loadInsight]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const result = await loadInsight();
      setInsight(result);
    } finally {
      setLastUpdatedAt(new Date());
      setRefreshing(false);
    }
  }, [loadInsight]);

  const handleMissionToggle = useCallback((missionIndex) => {
    setCompletedMissions((prev) => ({
      ...prev,
      [missionIndex]: !prev[missionIndex],
    }));
  }, []);

  if (!insight) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Health Pilot</Text>
        <Text style={styles.loading}>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  const baselineTomorrow =
    typeof insight.tomorrowCapacity.baseline === "number" && Number.isFinite(insight.tomorrowCapacity.baseline)
      ? insight.tomorrowCapacity.baseline
      : 0;

  const completedImpact = insight.missions.reduce((sum, mission, index) => {
    if (!completedMissions[index]) {
      return sum;
    }

    const impact =
      typeof mission.expectedImpact === "number" && Number.isFinite(mission.expectedImpact)
        ? mission.expectedImpact
        : 0;

    return sum + impact;
  }, 0);

  const projectedTomorrow = Math.min(100, baselineTomorrow + completedImpact);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <Text style={styles.logo}>Health Pilot</Text>

        <View style={styles.missionSection}>
          <Text style={styles.section}>Mission</Text>
          {insight.missions.map((mission, index) => (
            <Pressable
              key={index}
              onPress={() => handleMissionToggle(index)}
              accessibilityRole="button"
              accessibilityState={{ checked: Boolean(completedMissions[index]) }}
              style={styles.missionRow}
            >
              <Text style={styles.missionItem}>
                {completedMissions[index] ? "☑" : "☐"} {mission.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.discoverySection}>
          <Text style={styles.discoveryLabel}>Discovery</Text>
          <Text style={styles.discoveryItem}>🧪 {insight.discovery.title}</Text>
        </View>

        <View style={styles.compactCard}>
          <Text style={styles.section}>Today's Capacity</Text>
          <Text style={styles.capacity}>{insight.todayCapacity}</Text>
        </View>

        <View style={styles.compactCard}>
          <Text style={styles.section}>Tomorrow</Text>
          <Text style={styles.tomorrowValue}>
            {baselineTomorrow} → {projectedTomorrow} (+{completedImpact})
          </Text>
          {insight.tomorrowCapacity.reason ? (
            <Text numberOfLines={1} style={styles.tomorrowReason}>
              {insight.tomorrowCapacity.reason}
            </Text>
          ) : null}
          {lastUpdatedAt ? (
            <Text style={styles.lastUpdated}>Updated {formatLocalTime(lastUpdatedAt)}</Text>
          ) : null}
        </View>

        <View style={styles.compactCard}>
          <View style={styles.checkInSection}>
          <Text style={styles.section}>今日のチェックイン</Text>
          {CHECK_IN_ITEMS.map((item) => {
            const currentValue = checkInRatings[item.key];

            return (
              <View key={item.key} style={styles.checkInRow}>
                <Text style={styles.checkInLabel}>
                  {item.icon} {item.label}
                </Text>
                <View style={styles.checkInScale}>
                  <Text style={styles.checkInFace}>😖</Text>
                  <View style={styles.dotGroup}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Pressable
                        key={value}
                        onPress={() =>
                          setCheckInRatings((prev) => ({
                            ...prev,
                            [item.key]: value,
                          }))
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`${item.label} ${value}`}
                        style={styles.dotPressable}
                      >
                        <Text style={styles.dotText}>{value <= currentValue ? "●" : "○"}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.checkInFace}>😊</Text>
                </View>
              </View>
            );
          })}
          </View>
        </View>
      </ScrollView>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  logo: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  missionSection: {
    marginTop: 0,
    marginBottom: 26,
  },
  loading: {
    fontSize: 18,
    color: "#333",
  },
  section: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  missionRow: {
    marginTop: 8,
  },
  missionItem: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "600",
    color: "#111",
  },
  compactCard: {
    borderWidth: 1,
    borderColor: "#ececec",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  capacity: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111",
  },
  checkInSection: {
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  checkInRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  checkInLabel: {
    width: 104,
    fontSize: 15,
    color: "#222",
    fontWeight: "500",
  },
  checkInScale: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  checkInFace: {
    fontSize: 13,
    color: "#666",
  },
  dotGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 4,
  },
  dotPressable: {
    minWidth: 22,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  dotText: {
    fontSize: 16,
    color: "#222",
    lineHeight: 16,
  },
  tomorrowValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111",
  },
  tomorrowReason: {
    marginTop: 6,
    fontSize: 13,
    color: "#666",
  },
  lastUpdated: {
    fontSize: 11,
    color: "#9a9a9a",
    marginTop: 8,
  },
  discoverySection: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  discoveryLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 4,
  },
  discoveryItem: {
    fontSize: 15,
    color: "#333",
  },
});