# Ours

A private Letterboxd-style diary for two people. Log dates you already went on, save places you want to try, pin them on a map, rate them, and keep photos and comments in one shared notebook. Both phones stay in sync through Firebase.

This repo is meant to stay a sideloaded Android app (`com.ours.datelogger`). It is not set up for the Play Store.

## What you can do

- Two profiles, no email or password. Each phone picks a person once.
- Change name and profile photo, switch profile on a device, or delete a profile.
- **Diary** — dates you already logged, with a cover picture, stars, categories, and notes.
- **Plans** — future nights and restaurants. Mark a plan as logged after you go.
- **Calendar** — month view. Green marks logged days, rose marks planned days.
- **Places** — every restaurant or spot from logs and plans, on one map and in a list.
- Several places on a single date. Search as you type, tap a match, see it on the map.
- Main picture for the list/poster, plus extra photos on the detail page.
- YouTube-style comments with avatars. You can delete your own comments.

## Stack

Expo SDK 57, React Native, TypeScript, Expo Router, Firebase JS SDK (Firestore + Storage), Photon for place search, Leaflet/OpenStreetMap for maps.

## New machine setup

```bash
git clone https://github.com/Yigitalp02/ours-logger.git
cd ours-logger
npm install
copy src\config\firebase.example.ts src\config\firebase.ts
```

On macOS/Linux use `cp` instead of `copy`.

Open `src/config/firebase.ts` and paste the **Web** app keys from the existing Firebase project `ours-dates` (Firebase Console → Project settings → Your apps). Do not commit that file.

You need:

- Node 22+
- Android Studio / Android SDK (`ANDROID_HOME` set)
- A phone with USB debugging, or an emulator

Then:

```bash
npx expo run:android
```

That generates `android/` (gitignored), installs **Ours** on the connected device, and starts Metro.

If Gradle’s native build fails on Windows because it picked MSYS CMake:

```powershell
$env:Path = (@("$env:ANDROID_HOME\cmake\4.1.2\bin") + ($env:Path -split ';' | Where-Object { $_ -and $_ -notmatch 'msys64' })) -join ';'
npx expo run:android
```

If Expo asks to use port 8082, something is still on 8081. Only kill a **LISTENING** PID:

```powershell
netstat -ano | findstr :8081
taskkill /PID 12345 /F
```

Replace `12345` with the number on the LISTENING line. `TIME_WAIT` rows with PID `0` are leftovers and go away on their own.

## Firebase

The live project is **ours-dates**. Full console steps and rules are in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md).

Short version:

1. Web app config → `src/config/firebase.ts` (local only).
2. Firestore created, rules from `firebase/firestore.rules` published.
3. Storage created (Blaze is required for Storage on new projects). Rules from `firebase/storage.rules`.
4. Open rules are intentional: there is no login. Do not publish the APK or share the Firebase config.

Data:

| Path | Purpose |
| --- | --- |
| `profiles/{id}` | Name and avatar URL |
| `dates/{id}` | Title, day, `logged` / `planned`, categories, places, ratings, cover, extra photos, comments |
| Storage `profiles/` and `dates/` | Images |

## Project layout

```
src/app/                 Screens (Expo Router)
src/app/(tabs)/          Diary, Plans, Calendar, Places, Profile
src/app/date/[id].tsx    Date / plan detail
src/app/date-form.tsx    Create and edit
src/components/          Shared UI
src/context/AppContext.tsx
src/services/            Firestore, Storage, place search
src/config/              Firebase init (example committed, real file gitignored)
docs/AGENT_CONTEXT.md    Long brief for AI agents
```

## Scripts

| Command | What it does |
| --- | --- |
| `npx expo run:android` | Build, install, open on the USB phone |
| `npx expo start --dev-client` | Metro only, if the app is already installed |
| `npx tsc --noEmit` | Typecheck |
| `npx expo lint` | Lint |

## APK without a computer

After Firebase is wired:

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

`eas.json` already asks for an APK. Install it on both phones (unknown sources). One APK contains the JS bundle; keep Firebase keys in `firebase.ts` **before** you build.

## Continuing with an AI agent

Read [docs/AGENT_CONTEXT.md](./docs/AGENT_CONTEXT.md) and [AGENTS.md](./AGENTS.md) first. Those files describe the product rules, Firestore shape, routing, and Windows build traps.

## License

See [LICENSE](./LICENSE).
