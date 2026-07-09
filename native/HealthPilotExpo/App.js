import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { generateHealthPilotInsight } from "./src/ai/engine";
import { buildAiInput } from "./src/ai/mockInput";

export default function App() {
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadInsight() {
      const { input } = await buildAiInput();
      const result = await generateHealthPilotInsight(input);

      if (cancelled) {
        return;
      }

      setInsight(result);
    }

    loadInsight();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!insight) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Health Pilot</Text>
        <Text style={styles.item}>Loading...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.logo}>Health Pilot</Text>

        <View style={styles.missionSection}>
          <Text style={styles.section}>Mission</Text>
          <Text style={styles.missionSubtitle}>One clear focus for today</Text>
          {insight.missions.map((mission, index) => (
            <Text key={index} style={styles.missionItem}>
              □ {mission.title}
            </Text>
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
    marginBottom: 20,
  },
  missionSection: {
    marginBottom: 26,
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
  missionItem: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "600",
    marginTop: 8,
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