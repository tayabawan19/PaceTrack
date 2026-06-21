# PaceTrack — Mobile App

A full-stack running tracker mobile app built with React Native (Expo) and TypeScript. Track runs with live GPS, plan routes before you go, and stay motivated with streaks, achievements, and voice pace coaching.

> Backend repo: [PaceTrack-backend](https://github.com/tayabawan19/PaceTrack-backend)

## Features

- 🔐 **Secure onboarding** — email OTP signup, multi-step profile setup (fitness level, goals, height/weight, emergency contact)
- 📍 **Live GPS run tracking** — real-time distance, pace, and route drawn on a map (Haversine-based distance calculation)
- 🗺️ **Route planning** — pick a destination on the map, get a real road-following route via OSRM routing
- 📊 **Dashboard** — daily/weekly stats, weekly calorie chart, photo-driven stat cards
- 🔥 **Streaks & achievements** — gamified motivation system with unlockable badges
- 🗣️ **Voice pace coaching** — spoken km milestones during a run
- 🌗 **Light/dark mode** — full theme system with persisted preference
- 📤 **Share runs** — export a completed run as a shareable image

## Tech Stack

- **Framework:** React Native (Expo) + TypeScript
- **Navigation:** React Navigation
- **Maps/Location:** react-native-maps, expo-location
- **Animations:** react-native-reanimated
- **State/Storage:** AsyncStorage
- **Backend:** Node.js + Express + MongoDB ([separate repo](https://github.com/tayabawan19/PaceTrack-backend))

## Getting Started

```bash
git clone https://github.com/tayabawan19/PaceTrack.git
cd PaceTrack
npm install
npx expo start
```

Scan the QR code with the **Expo Go** app (iOS/Android).

> Requires the [PaceTrack backend](https://github.com/tayabawan19/PaceTrack-backend) running and reachable for full functionality.

## Author

Built by **Tayyab** — BS Software Engineering student, COMSATS University Islamabad. Built as a portfolio project to demonstrate full-stack mobile development.
