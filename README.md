# Seedling 1.0.0 — Android and iOS app

Photo editor and sticker maker by **SlopLVI**. Built with Capacitor 8. App ID: `com.sloplvi.seedling`.

Everything runs on the device. The app makes no network requests unless you turn on the optional full-size model download (see below).

---

## Already filled in

- Support email: `gcup243@gmail.com`. This is a placeholder: when you have a permanent address, change `contact` in `const APP =` in `www/index.html`, then run `npx cap sync`.
- Governing law: Ontario, and the federal laws of Canada that apply there
- App ID: `com.sloplvi.seedling`. This is final: it can never change after the first upload.

Use the same support email in both store consoles.

Both stores need the privacy policy at a public web address. A ready page is in `docs/privacy.html`. To host it free with GitHub Pages:

1. Put this project in a GitHub repository.
2. Go to Settings → Pages and choose "Deploy from a branch".
3. Select your main branch and the `/docs` folder.

The address will be `https://YOUR-NAME.github.io/REPO/privacy.html`. Use that link in both store consoles.

---

## What you need

- **Node.js 20 or newer**
- **Android:** Android Studio (latest), which includes the Android SDK and JDK 21
- **iOS:** a Mac with Xcode 16 or newer, plus an Apple Developer Program membership (US$99 a year)
- **Google Play:** a Play Console developer account (US$25 once). New personal accounts must run a closed test with at least 12 testers for 14 days before going public, so start that early.

## First run

```bash
npm install
npx cap sync
npx cap open android     # opens Android Studio → press Run
npx cap open ios         # opens Xcode → pick your phone → press Run
```

The web app lives in `www/`. The `android/` and `ios/` folders are real native projects; open and edit them like any other.

---

## What's in the app (native parts)

| Feature | How |
|---|---|
| Save to photo library | Seedling's own small plugin, `SeedlingGallery`. **Android 10+**: saves to *Pictures › Seedling* with **no permission**. Android 7–9: asks for storage once. **iOS**: asks for *add photos only* access. Seedling never reads the photo library. If saving is refused, it offers the share sheet instead. |
| Picking photos | The system photo picker (no permission needed on either platform). |
| Haptics | Native taps, including the reveal buzz after a cutout. Respects the Vibration setting. |
| Android back button | Steps back one level: legal page → dialog → settings → tool → layer drawer → toolbar → home → leaves the app. |
| Status and navigation bars | Follow the app theme (light or dark). Notches and gesture bars are respected. |
| AI models | **Fast** (4.6 MB) and **Detailed** (46 MB) both ship inside the app and work offline. |
| Privacy | Content-Security-Policy blocks every outside connection. iOS privacy manifest declares no tracking and no data collected. |

Files to know:

- `www/native.js` — all native glue. It does nothing in a normal browser.
- `www/config.js` — optional model host
- `android/app/src/main/java/com/sloplvi/seedling/GalleryPlugin.java`
- `ios/App/App/GalleryPlugin.swift` and `ios/App/App/MainViewController.swift`
- `ios/App/App/PrivacyInfo.xcprivacy`
- `assets/` — icon and splash sources. After changing them, run `npm run assets`.

---

## Signing: you hold the keys

Signing keys prove that updates come from you. Create them yourself and keep them private: nobody else, including me, should ever have them. Back them up somewhere safe (a password manager plus an offline copy).

### Android (Play App Signing)

1. Create your **upload key**. Run this once in the `android/` folder and choose strong passwords:
   ```bash
   keytool -genkeypair -v -keystore seedling-upload.jks -alias upload -keyalg RSA -keysize 4096 -validity 10000
   ```
2. Create `android/keystore.properties`. This file is git-ignored.
   ```properties
   storeFile=seedling-upload.jks
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=upload
   keyPassword=YOUR_KEY_PASSWORD
   ```
3. Build the bundle:
   ```bash
   npx cap sync android
   cd android && ./gradlew bundleRelease
   ```
   The bundle is written to `android/app/build/outputs/bundle/release/app-release.aab`.
4. In Play Console, create the app and keep **Play App Signing** on. Google then holds the final app signing key. If you ever lose your upload key, Google can reset it.

### iOS

1. In Xcode, select the **App** target → **Signing & Capabilities**. Choose your Team and leave "Automatically manage signing" on.
2. Create the app in App Store Connect with bundle ID `com.sloplvi.seedling`.
3. Choose **Product → Archive**, then **Distribute App → App Store Connect**.

---

## Version numbers

The app is currently version 1.0.0, build 1. For each update, raise both numbers:

- **Android:** `versionName` and `versionCode` in `android/app/build.gradle`. `versionCode` must go up by at least 1 on every upload.
- **iOS:** in Xcode, App target → General → Version and Build. These are stored as `MARKETING_VERSION` and `CURRENT_PROJECT_VERSION`.
- **Inside the app:** `version` in `const APP =` in `www/index.html`.

## Changing the app ID

1. Change `appId` in `capacitor.config.json`.
2. **Android:** change `namespace` and `applicationId` in `android/app/build.gradle`, move the `java/com/sloplvi/seedling` folder to match, update the `package` line at the top of both Java files, and update `package_name` and `custom_url_scheme` in `android/app/src/main/res/values/strings.xml`.
3. **iOS:** Xcode → App target → General → Bundle Identifier.

---

## Store forms: honest answers for this build

**Google Play → Data safety**
- Does your app collect or share user data? **No.**
- Is data encrypted in transit? There is no data to transmit. If you enable the model download, it uses HTTPS.
- Can users request deletion? All data lives on the device. Settings → Storage → Clear all, or uninstall the app.

**Google Play → other forms**
- Permissions declaration: none needed. There is no READ_MEDIA_IMAGES; photos come from the system picker.
- Content rating questionnaire: a photo editor with no user-to-user communication and no generated explicit content, so expect Everyone / PEGI 3.
- Ads: **No.**
- Price: **Free.** On Google Play, a free app can never be changed to paid. A paid version later would need a new listing or in-app purchases. Because Seedling is free, Google shows only your legal name, country and email, not your address.

**App Store Connect**
- App Privacy: **Data Not Collected.**
- Export compliance: already answered in Info.plist (only standard encryption, so no documents needed).
- Age rating: 4+.
- Category: Photo & Video.
- Price: **Free**, with no in-app purchases. The in-app Terms refer to Apple's standard licence agreement (EULA).

**Screenshots**
- Play: at least 2 phone screenshots.
- App Store: 6.9" iPhone screenshots (1320×2868). iPad screenshots are also needed, because the app supports iPad (13", 2064×2752). To drop iPad, set Targeted Device Family to iPhone only in Xcode.

---

## Optional: the full-size model

**Detailed · full size** (179 MB) is too big to ship inside the app, so it is hidden by default. To offer it as a download:

1. Run `tools/make-hosted-model.sh`. It downloads ISNet from its public source, checks the checksum, and splits it into 15 parts.
2. Upload the parts to any HTTPS host that allows cross-origin requests (CORS) from `https://localhost` (Android) and `capacitor://localhost` (iOS). Cloudflare R2 and Bunny work.
3. Set `modelBaseUrl` in `www/config.js` to that folder.
4. Add the host to `connect-src` in the Content-Security-Policy at the top of `www/index.html`.
5. Run `npx cap sync`.

The in-app privacy policy already describes this download. Note that turning it on means the app does contact a server, so the "no network" claim in store copy would need softening.

---

## Testing checklist before you submit

Test on real phones: one mid-range Android (for example a Galaxy A series) and one iPhone.

- [ ] First launch: the sprout animation plays and the sample photo loads.
- [ ] Open a photo from the picker. Run every AI tool with **Fast**, then with **Detailed**.
- [ ] Save a photo and a sticker. Check that both appear in Photos / Gallery, and that the sticker keeps its transparent background.
- [ ] Deny the save permission on iOS. The share sheet should be offered instead.
- [ ] Android back button at every level. Rotate the device, then switch to dark mode and back.
- [ ] Airplane mode: everything should still work.
- [ ] A 4 GB-RAM Android or an older iPhone with **Detailed**. It should fall back to Fast with a message, not crash. iOS limits web-view memory more tightly than Android, so this is the most likely problem area.

## Known limits of this build

- It was assembled and its web parts were tested in Chromium, including a simulated native bridge. It has **not** yet been compiled in Android Studio or Xcode, so expect to fix small issues on your first build.
- Landscape works but is designed for portrait. To lock portrait, remove the landscape entries in `Info.plist` and add `android:screenOrientation="portrait"` to the activity in `AndroidManifest.xml`.

## Licences

Seedling's own code: © 2026 SlopLVI, all rights reserved. It bundles open-source components (ONNX Runtime, face-api, TensorFlow.js, U²-Net, ISNet, and three fonts). Their licences are shown in the app under Settings → Open-source licences. All of them allow commercial use, including in paid apps if you add a paid version later.
