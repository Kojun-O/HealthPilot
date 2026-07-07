import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  authorizeSleepRead,
  isPermissionDeniedError,
  readLastNightSleepDurationHours,
} from './src/health/sleepDuration';

export default function App() {
  const [sleepState, setSleepState] = useState({
    status: 'loading',
    minutes: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadSleep() {
      try {
        await authorizeSleepRead();
        const hours = await readLastNightSleepDurationHours();
        const minutes = Math.round(hours * 60);

        if (!isMounted) {
          return;
        }

        if (minutes <= 0) {
          setSleepState({ status: 'no-data', minutes: null });
          return;
        }

        setSleepState({ status: 'ok', minutes });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (isPermissionDeniedError(error)) {
          setSleepState({ status: 'permission-required', minutes: null });
          return;
        }

        setSleepState({ status: 'no-data', minutes: null });
      }
    }

    loadSleep();

    return () => {
      isMounted = false;
    };
  }, []);

  const sleepValue = useMemo(() => {
    if (sleepState.status === 'loading') {
      return 'Loading...';
    }

    if (sleepState.status === 'permission-required') {
      return 'Permission required';
    }

    if (sleepState.status !== 'ok' || sleepState.minutes == null) {
      return 'No sleep data';
    }

    const hoursPart = Math.floor(sleepState.minutes / 60);
    const minutesPart = sleepState.minutes % 60;
    return `${hoursPart}h ${minutesPart}m`;
  }, [sleepState]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sleep</Text>
      <Text style={styles.value}>{sleepValue}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  value: {
    fontSize: 20,
    textAlign: 'center',
  },
});
