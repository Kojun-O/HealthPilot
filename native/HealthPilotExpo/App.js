import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { generateHealthPilotInsight } from "./src/ai/engine";
import { buildAiInput } from "./src/ai/mockInput";

export default function App() {
  const [insight, setInsight] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [completedMissions, setCompletedMissions] = useState({});

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
          <Text style={styles.missionSubtitle}>One clear focus for today</Text>
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

        <View style={styles.compactCard}>
          <Text style={styles.section}>Today's Capacity</Text>
          <Text style={styles.capacity}>{insight.todayCapacity}</Text>
        </View>

        <View style={styles.compactCard}>
          <Text style={styles.section}>Tomorrow</Text>
          <Text style={styles.tomorrowValue}>
            {insight.tomorrowCapacity.baseline} →{" "}
            {insight.tomorrowCapacity.withMissions} (+{insight.tomorrowCapacity.delta})
          </Text>
          {insight.tomorrowCapacity.reason ? (
            <Text numberOfLines={1} style={styles.tomorrowReason}>
              {insight.tomorrowCapacity.reason}
            </Text>
          ) : null}
        </View>

        {lastUpdatedAt ? (
          <Text style={styles.lastUpdated}>Last updated {formatLocalTime(lastUpdatedAt)}</Text>
        ) : null}

        <View style={styles.discoverySection}>
          <Text style={styles.discoveryLabel}>Discovery</Text>
          <Text style={styles.discoveryItem}>🧪 {insight.discovery.title}</Text>
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
  missionSubtitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: "#111",
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
    fontSize: 12,
    color: "#888",
    marginTop: -2,
    marginBottom: 12,
    paddingHorizontal: 2,
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