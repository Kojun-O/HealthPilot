# Health Pilot Native (Expo) - Sprint 29

Scope:
- Keep web prototype intact under `docs/`
- Enable Expo development build path (not Expo Go)
- Prepare HealthKit for first metric: sleep duration

## What is already prepared

- Expo app scaffold in this folder
- `expo-dev-client` added so iOS testing uses a development build
- `react-native-health` added for HealthKit bridge APIs
- `eas.json` added with a `development` profile
- Custom Expo config plugin at `plugins/withHealthKit.js` to set HealthKit entitlement and iOS usage descriptions
- Sleep reader helper at `src/health/sleepDuration.js`

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
- The first implementation target is read-only sleep duration.
- This sprint intentionally avoids broader UI or architecture changes.
