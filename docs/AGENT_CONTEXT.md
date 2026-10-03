# Ours — agent context

This file is the source of truth for any AI agent continuing this repo. Read it before changing code. Also follow root `AGENTS.md` for Expo SDK rules.

## Product

**Ours** is a private Letterboxd-style diary for two people (a couple). They log dates they already went on and save future plans. Both Android phones stay in sync through Firebase. The app is not published on the Play Store. They install a debug/preview APK or run it over USB.

Display name: **Ours**. Package: `com.ours.datelogger`. Slug: `ours-dates`.

There is **no email/password auth**. Each person creates or picks a profile (max 2). The device stores the selected `profileId` in AsyncStorage (`@ours/profileId`).

## Users and constraints

- Two Android phones, same Firebase project.
- Firebase JS SDK (works without `@react-native-firebase`).
- Firestore + Storage. Storage on new Firebase projects requires **Blaze** (pay-as-you-go). Firestore itself can live on Spark; they already created project `ours-dates`.
- Security rules are intentionally open (`allow read, write: if true`) because there is no login. The GitHub repo is public — **never commit `src/config/firebase.ts`**.
- UI is dark, Letterboxd-inspired (green `#00C030`, orange stars `#FF8000`, rose `#E85A71` for plans). **No emoji in the UI.** Use `@expo/vector-icons/Ionicons` only.

## Stack

| Layer | Choice |
| --- | --- |
| Runtime | Expo SDK **57**, React 19, React Native 0.86, TypeScript strict |
| Navigation | Expo Router, file routes in `src/app/` |
| State | `src/context/AppContext.tsx` — profiles + dates via Firestore `onSnapshot` |
| Backend | Firebase JS SDK v12: Firestore + Storage |
| Places | Photon autocomplete `https://photon.komoot.io/api/` |
| Maps | `react-native-webview` + Leaflet + OSM tiles |
| Images | `expo-image-picker`, `expo-image-manipulator`, `expo-image` |
| Local id | `@react-native-async-storage/async-storage` |

Path alias: `@/*` → `src/*` (`tsconfig.json`).

Entry: `index.ts` imports `react-native-gesture-handler` then `expo-router/entry`.

## How to run (Windows + USB Android)

The owner typically does **not** use Expo Go. They build a native debug app:

```bash
npx expo run:android
```

Prerequisites: Android SDK (`ANDROID_HOME`), USB debugging allowed, device visible in `adb devices`.

This machine had **MSYS CMake** on PATH (`C:\msys64\usr\bin\cmake.exe`), which breaks NDK configure (`C;` path corruption). If the Gradle C++ step fails, prepend Android SDK CMake and drop msys from PATH:

```powershell
$env:Path = (@("$env:ANDROID_HOME\cmake\4.1.2\bin") + ($env:Path -split ';' | Where-Object { $_ -and $_ -notmatch 'msys64' })) -join ';'
npx expo run:android
```

`android/` and `ios/` are generated (CNG). Do not hand-edit them. They are gitignored.

If port 8081 is busy, only kill a **LISTENING** PID:

```powershell
netstat -ano | findstr :8081
taskkill /PID <listening_pid> /F
```

`TIME_WAIT` lines with PID `0` cannot be killed. They clear themselves.

After clone on a new PC:

1. `npm install`
2. Copy `src/config/firebase.example.ts` → `src/config/firebase.ts` and paste the existing Web app keys from Firebase project **ours-dates** (or recreate — see `FIREBASE_SETUP.md`).
3. `npx expo run:android`

## Firebase

Project id: `ours-dates` (already created). Use a **Web** app config, not Android `google-services.json`.

Collections:

### `profiles/{profileId}`

```
name: string
photoUrl: string | null
createdAt: Timestamp
```

Max 2 documents. Photos: Storage `profiles/{id}/{file}.jpg`.

### `dates/{dateId}`

```
title: string
happenedAt: Timestamp | Date
status: 'logged' | 'planned'          // missing status => treat as logged
categories: string[]
place: Place | null                   // first place, kept for older docs
places: DatePlace[]                   // source of truth for locations
placeRating: number                   // first place rating, legacy
overallRating: number                 // 0–5, half steps
cover: DatePhoto | null               // list poster + detail hero
photos: DatePhoto[]                   // extra stills only, not the cover
comments: DateComment[]
createdBy: profileId
createdAt / updatedAt: Timestamp
```

```
Place      { name, address, lat, lng }
DatePlace  Place & { id, rating }
DatePhoto  { id, url, uploadedBy }
DateComment { id, profileId, text, createdAt: ISO string }
```

Old documents may only have `place` / `placeRating`. Always read through `datePlaces(entry)` in `src/types.ts`.

Rules copies: `firebase/firestore.rules`, `firebase/storage.rules` (open). Test-mode 30-day expiry must be replaced or writes die.

Helpers: `src/config/firebase.ts` (local, gitignored), `isFirebaseConfigured`, `requireDb()`, `requireStorage()`. If keys are missing, root stack shows `setup`.

## App flow

`src/app/_layout.tsx` wraps `AppProvider` and a Stack with `Stack.Protected`:

| Guard | Screens |
| --- | --- |
| Firebase not configured | `setup` |
| Configured, no selected profile | `welcome` |
| Configured + profile | `(tabs)`, `date/[id]`, `date-form`, `edit-profile` |

`src/app/index.tsx` redirects to `/setup`, `/welcome`, or `/(tabs)`.

### Tabs (`src/app/(tabs)/`)

1. **Diary** `index.tsx` — logged dates only, FAB → `/date-form`
2. **Plans** `plans.tsx` — `status === 'planned'`, FAB → `/date-form?status=planned`
3. **Calendar** `calendar.tsx` — month grid; green dots = logged, rose dots = planned
4. **Places** `places.tsx` — flattened list + combined map of all `datePlaces`
5. **Profile** `profile.tsx` — edit, switch (clears AsyncStorage), delete profile

### Date form `date-form.tsx`

Query: `id` (edit), `status=planned` (new plan).

Order: main/cover picture, title, when, categories, stars (logged only), **places search + N places each with map/stars**, other photos, optional first comment on create.

Places: `PlaceSearch` (Photon, 2+ chars, ~280ms debounce). User **must tap a result** so lat/lng exist. Typing a name without selecting does not pin a map.

Cover vs extras: `cover` is the list poster and detail hero. `photos` are the gallery on the detail page only.

### Date detail `date/[id].tsx`

Hero = cover. Places section: overview map if 2+ pins, then each place. Photos grid = extras. Comments are YouTube-style: avatar + composer + newest first. Author can delete their own comment. Planned dates have **Mark as logged**.

### Welcome / profiles

`welcome.tsx`: pick existing profile or create (name + photo) if `profiles.length < 2`. Delete is on Profile tab (`removeProfile` → Firestore delete + clear local id). Dates remain.

## Code map

```
src/
  app/                    Expo Router screens
  components/             UI: DateCard, StarRating, PlaceMap, PlaceSearch, PhotoStrip, …
  config/                 firebase.ts (local) / firebase.example.ts (committed)
  context/AppContext.tsx  subscriptions + CRUD
  services/
    dates.ts              listen / create / update / comments / status
    profiles.ts           listen / create / update / delete
    photos.ts             compress + Storage upload
    places.ts             Photon search
  lib/                    createId, date formatters
  types.ts                domain types + datePlaces / coverUrl / isPlanned
  theme.ts                colors, spacing, radius
```

`AppContext` exposes: `profiles`, `currentProfile`, `dates`, `loggedDates`, `plannedDates`, profile CRUD, `addDate` / `saveDate`, `addDateComment` / `removeDateComment`, `changeDateStatus`, `removeDate`, `removeProfile`, `signOutProfile`.

Firestore listeners: `profiles` ordered by `createdAt` asc, `dates` by `happenedAt` desc.

Photos: resize (cover/gallery width 1600, avatars 600), JPEG ~0.72, `uploadBytes` + `getDownloadURL`.

Maps: Leaflet HTML in a WebView. Remount with `key` from marker coords so a new selection redraws. Markers need numeric lat/lng.

## Product rules when changing the app

- Keep two-profile, no-auth model unless the user asks otherwise.
- Do not add emoji. Use Ionicons matching the existing tab bar.
- Do not introduce React Navigation navigators beside Expo Router.
- Install native modules with `npx expo install`, not raw npm, so SDK 57 versions match.
- After UI changes, the user reloads via `npx expo run:android` or Metro refresh. Browser verification does not apply.
- Typecheck: `npx tsc --noEmit`. Lint: `npx expo lint`.
- Do not commit `src/config/firebase.ts`, `android/`, `ios/`, `node_modules/`, APKs.
- Place search must keep Photon (or another geocoder that returns lat/lng). A free-text name without coords will not show on the map.
- Comments are a list (many per person), not one note per profile.
- A date can have many `places`.

## Known issues / history

- First native build failed: DNS to `dl.google.com`, then MSYS CMake vs Android NDK.
- Firebase Storage wizard now demands Blaze; they set a 25 TRY budget alert. Cost should stay ~0 for two people.
- Nominatim was the first geocoder and often returned nothing from React Native (User-Agent). Replaced with Photon.
- Expo Go for SDK 57 may not match Play Store. Prefer `expo run:android`.

## Related docs

- `README.md` — human setup and feature list
- `FIREBASE_SETUP.md` — console clicks and rules
- `AGENTS.md` — Expo SDK / Router conventions
- `firebase/*.rules` — copy-paste rules
