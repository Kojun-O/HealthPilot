import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { generateHealthPilotInsight } from "./src/ai/engine";

export default function App() {
  const [insight, setInsight] = useState(null);

  useEffect(() => {
    async function loadInsight() {
      const result = await generateHealthPilotInsight();
      setInsight(result);
    }

    loadInsight();
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
      <Text style={styles.logo}>Health Pilot</Text>

      <Text style={styles.section}>Today's Capacity</Text>
      <Text style={styles.capacity}>{insight.todayCapacity}</Text>

      <Text style={styles.section}>Tomorrow</Text>
      <Text style={styles.tomorrow}>
        {insight.tomorrowCapacity.baseline} →{" "}
        {insight.tomorrowCapacity.withMissions} (+{insight.tomorrowCapacity.delta})
      </Text>

      <Text style={styles.section}>Mission</Text>
      {insight.missions.map((mission, index) => (
        <Text key={index} style={styles.item}>
          □ {mission.title}
        </Text>
      ))}

      <Text style={styles.section}>Discovery</Text>
      <Text style={styles.item}>🧪 {insight.discovery.title}</Text>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 32,
    justifyContent: "center",
  },
  logo: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 36,
  },
  section: {
    fontSize: 16,
    color: "#666",
    marginTop: 18,
  },
  capacity: {
    fontSize: 52,
    fontWeight: "700",
  },
  tomorrow: {
    fontSize: 24,
    fontWeight: "600",
  },
  item: {
    fontSize: 18,
    marginTop: 8,
  },
});