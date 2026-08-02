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

## Backend auth token setup (development only)

Set backend access token before starting Expo dev client:

```bash
export EXPO_PUBLIC_HEALTH_PILOT_BACKEND_BASE_URL="https://healthpilot-backend.onrender.com"
export EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN="your-dev-backend-token"
npx expo start --dev-client
```

On Windows PowerShell:

```powershell
$env:EXPO_PUBLIC_HEALTH_PILOT_BACKEND_BASE_URL = "https://healthpilot-backend.onrender.com"
$env:EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN = "your-dev-backend-token"
npx.cmd expo start --dev-client
```

- Copy the token value from Render `HEALTH_PILOT_BACKEND_TOKEN` into `EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN` for app runtime.
- This token authenticates app access to the backend endpoint configured above.
- This is not an OpenAI API key.
- Never place `OPENAI_API_KEY` in app code, Expo config, or client logs.

## PC-free iPhone testing with EAS Preview Build

Use EAS Environment Variables for the `preview` profile so the app can run without Metro/PC.

1. Create preview env vars in EAS (project scope):

```powershell
npx.cmd eas env:create --scope project --environment preview --name EXPO_PUBLIC_HEALTH_PILOT_BACKEND_BASE_URL --value "https://healthpilot-backend.onrender.com" --visibility plaintext
npx.cmd eas env:create --scope project --environment preview --name EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN --value "<Render HEALTH_PILOT_BACKEND_TOKEN>" --visibility secret
```

2. Build iOS preview binary (internal distribution):

```powershell
npx.cmd eas build --platform ios --profile preview
```

3. Install the generated preview build on iPhone from the EAS build link.

4. Launch the installed app directly on iPhone.

Notes:
- `preview` profile in `eas.json` is connected to EAS environment `preview` via `"environment": "preview"`.
- `EXPO_PUBLIC_HEALTH_PILOT_BACKEND_TOKEN` must never be committed to source files.
- `OPENAI_API_KEY` must exist only on Render backend, never in frontend app config.
