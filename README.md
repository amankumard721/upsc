# Game Cheat Codes

A premium, modern cheat code reference application for open-world driving games, built from scratch using Flutter and Dart. Designed with a sleek, cyber-themed Glassmorphism aesthetic, smooth Hero animations, and fully functioning offline storage support.

## 🚀 Key Features

* **Sleek Cyberpunk Visuals:** Built entirely using Material Design 3 guidelines. It features customized obsidian-purple gradients, translucent glassmorphism cards (`BackdropFilter`), and premium Google Fonts styling (using the **Outfit** typography).
* **Automatic Animated Splash Screen:** Engaging fade and scale entry animation that transitions seamlessly into the home page.
* **Smart Search Bar:** Real-time character-by-character filtering by cheat name or cheat code. Tracks recent search history locally using **Hive**.
* **Categories Grid:** Interactive grid layout containing category classifications (Bikes, Cars, Helicopters, Planes, Weapons, Characters, Special Vehicles, and Favorites) complete with high-resolution generated graphic backgrounds.
* **Interactive Cheat Sheets:** Copy cheat codes with a single tap (notifying users via an adaptive Material Snackbar), share cheat codes using native system sheets, and toggle favorites easily.
* **Persistent Favorites Database:** Mark codes as favorites to access them immediately. All settings and favorites are stored locally on the device's offline database using **Hive** and **SharedPreferences**.
* **Adaptive Dark Mode Support:** Light Mode, Dark Mode, and Automatic System Theme integration dynamically togglable via the Settings screen.
* **100% Offline Support:** Requires zero internet permissions. All codes and assets are pre-packaged locally.

---

## 🛠️ Technology Stack

* **Framework:** Flutter (Latest Stable Channel)
* **Language:** Dart
* **Design System:** Material 3 Design
* **Typography:** Outfit (Google Fonts)
* **State Management:** Provider
* **Database & Cache:** Hive & Hive Flutter (Local favorites list, search history)
* **Local Settings:** SharedPreferences (Theme selection persistence)
* **Native Utilities:** Share Plus (System share sheet), Clipboard (Copy codes)

---

## 📂 Folder Structure

The project has been organized following Flutter clean structure best practices:

```text
lib/
├── main.dart             # App Entry point (Initializes Hive/Preferences, configures Provider/Theme)
├── models/
│   └── cheat_code.dart   # CheatCode model (serializable to Map/JSON)
├── screens/
│   ├── splash_screen.dart       # Animated Splash screen (2-sec scale & fade timer)
│   ├── home_screen.dart         # Main Dashboard, Search, Banner Slider, Category Grid
│   ├── category_screen.dart     # Dedicated category filtered listing
│   ├── cheat_detail_screen.dart # Interactive Hero cheat info, copy, share, related cheats list
│   ├── favorites_screen.dart    # Bookmarked offline cheats screen
│   └── settings_screen.dart     # Themes, disclaimer, privacy policy, and about information
├── widgets/
│   ├── glass_container.dart     # Reusable glassmorphism backdrop container
│   ├── cheat_card.dart          # Reusable Cheat card widget
│   ├── custom_search_bar.dart   # Interactive search field with history dropdown
│   └── shimmer_loading.dart     # Custom shader shimmer loading skeleton
├── services/
│   ├── hive_service.dart        # Database wrapper for favorites list & recent searches
│   └── settings_service.dart    # SharedPreferences theme toggle wrapper
├── utils/
│   └── sample_data.dart         # Premium pre-packaged offline sample cheat codes
└── theme/
    └── app_theme.dart           # Custom Light & Dark color schemas and Google Fonts config
```

---

## 📦 Setting Up and Running Locally

To run the project on your local machine:

1. Clone or download this project to your local directory.
2. Make sure you have the [Flutter SDK installed](https://docs.flutter.dev/get-started/install) (version 3.22.x or above recommended).
3. Verify your connected devices by running:
   ```bash
   flutter devices
   ```
4. Fetch the package dependencies:
   ```bash
   flutter pub get
   ```
5. Run the application in developer mode:
   ```bash
   flutter run
   ```

---

## 🛠️ Android Build and Release

To build a release-ready package for Android:

1. Verify that your code complies with analysis guidelines and compiles without warnings:
   ```bash
   flutter analyze
   ```
2. Build a release-ready App Bundle (AAB), which is the standard format required by Google Play Console:
   ```bash
   flutter build appbundle --release
   ```
3. Alternatively, if you need an APK file for testing on devices directly:
   ```bash
   flutter build apk --release
   ```
   The generated installation file will be located under `build/app/outputs/flutter-apk/app-release.apk`.

---

## ⚠️ Unofficial Disclaimer

This application is an unofficial cheat code reference app created for informational purposes only. It is not affiliated with, endorsed by, or associated with any game developer or publisher. No codes or actions in this application interfere with, modify, or hack external games.
