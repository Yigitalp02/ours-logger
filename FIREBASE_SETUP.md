# Connect Firebase

The app is already wired to Firestore (dates + profiles) and Storage (photos). You only need to create a Firebase project and paste the keys.

Use the free Spark plan. Two people logging dates will stay well inside the free limits.

## 1. Create the project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Name it something like `ours-dates`.
4. You can turn **Google Analytics** off. It is not used.
5. Create the project and wait until it finishes.

## 2. Register a web app

The Expo app talks to Firebase with the JavaScript SDK, so you want a **Web** app, not Android.

1. On Project Overview, click the **Web** icon (`</>`).
2. App nickname: `Ours`.
3. Do not enable Hosting.
4. Click **Register app**.
5. Copy the `firebaseConfig` object. It looks like this:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "ours-dates.firebaseapp.com",
  projectId: "ours-dates",
  storageBucket: "ours-dates.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcd",
};
```

## 3. Paste the keys into the app

```bash
copy src\config\firebase.example.ts src\config\firebase.ts
```

On macOS/Linux: `cp src/config/firebase.example.ts src/config/firebase.ts`

Open `src/config/firebase.ts` and replace the `YOUR_...` placeholders with the values you copied. Use the exact `storageBucket` Firebase gave you. Newer projects end with `.firebasestorage.app`; older ones use `.appspot.com`.

`src/config/firebase.ts` is gitignored so keys stay off GitHub. After you save the file, restart the app. The welcome screen should appear instead of the setup checklist.

## 4. Create Firestore

1. In the left menu: **Build → Firestore Database**.
2. Click **Create database**.
3. Start in **test mode** for now. You will replace the rules in the next step.
4. Pick a region close to you, for example `europe-west`.
5. Enable it.

Then open the **Rules** tab and replace everything with the contents of `firebase/firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Click **Publish**.

These rules are open on purpose. There is no login, and only you two will have the APK. Do not put this app on the Play Store or share the APK publicly.

## 5. Create Storage

1. Left menu: **Build → Storage**.
2. Click **Get started**.
3. Start in test mode, then continue.
4. Use the same region if asked.
5. Open the **Rules** tab and replace everything with `firebase/storage.rules`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

Click **Publish**.

## 6. What the app writes

| Collection / path | What it stores |
| --- | --- |
| `profiles/{id}` | Name and profile photo URL |
| `dates/{id}` | Title, day, categories, stars, place, photos, notes |
| `profiles/{id}/{file}.jpg` | Profile photos |
| `dates/{id}/{file}.jpg` | Date photos |

Both phones subscribe to the same collections, so a new date or photo on one phone shows up on the other without refresh.

## 7. First run checklist

1. Phone A: create your profile.
2. Phone B: you should already see that profile. Create hers, then tap her card.
3. Log one date with a photo and a restaurant search.
4. Confirm it appears on the other phone.

If something fails, the Diary tab shows the Firebase error. The usual causes are:

- keys still set to `YOUR_API_KEY`
- Firestore or Storage not created
- rules not published
- Expo not restarted after pasting keys

## 8. Install the APK on both phones

You do not need the Play Store.

```bash
npm install -g eas-cli
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

When the build finishes, download the APK and send it to both phones (Drive, Telegram, cable). On each phone: **Settings → Security → Install unknown apps** for Files or Chrome, then open the APK.

Build the APK after Firebase is connected. The keys are baked into the app, so one APK works for both of you.
