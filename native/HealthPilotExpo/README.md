# Health Pilot Native (Expo) - Apple Health MVP

Scope:
- Keep web prototype intact under `docs/`
- Enable Expo development build path (not Expo Go)
- Read the five Apple Health metrics used by the AI input layer

## What is already prepared

- Expo app scaffold in this folder
- `expo-dev-client` added so iOS testing uses a development build
- `@kingstinct/react-native-healthkit` added for HealthKit bridge APIs
- `react-native-nitro-modules` added for Nitro-based native bindings
- `eas.json` added with a `development` profile
- Expo config plugin from `@kingstinct/react-native-healthkit` sets the HealthKit entitlement and iOS usage descriptions
- Apple Health adapter at `src/health/appleHealth.js`

## Required local commands (Mac)

From repository root:

```bash
cd native/HealthPilotExpo
npm install
npx expo login
npx eas login
npx eas build:configure
npx eas build --platform ios --profile development
```

After the first build:

```bash
npx expo start --dev-client
```

## Notes

- HealthKit access requires an iOS development build. Expo Go cannot load HealthKit native modules.
- The app requests read-only HealthKit access for sleep, resting heart rate, heart rate variability, steps, and weight.
- This sprint intentionally avoids broader UI or architecture changes.
