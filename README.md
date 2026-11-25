<<<<<<< HEAD
# Shake It Up

Tilt your phone to roll the ball into the basket. React Native + Expo + JavaScript.

## Run it

```bash
npm install
npx expo install --fix   # aligns every package with your installed Expo SDK
npx expo start
```

Open the QR code with **Expo Go on a real phone**. Simulators and emulators have no real accelerometer, so the game shows a "No accelerometer" message there.

## How it works

| Piece | Role |
| --- | --- |
| `expo-sensors` (Accelerometer) | Tilt input, read at ~60 Hz |
| `@shopify/react-native-skia` | Board, ball, basket, background, confetti |
| `react-native-reanimated` | Shared values that feed Skia, so the ball moves without re-rendering React |
| `@react-native-async-storage/async-storage` | Leaderboard and settings |
| `@react-navigation/native-stack` | Navigation |

- The phone's position during the 3-2-1 countdown becomes the neutral pose, so you can hold it at any angle.
- The countdown also detects the platform's axis convention (iOS and Android report gravity with opposite signs). If the ball still rolls the wrong way, switch on **Settings → Invert controls**.
- Sensitivity (1-10) scales how much acceleration a given tilt produces.
- Collisions: walls (bounce with energy loss), circular bumpers (appear every 3 baskets, up to 3) and the basket. The ball only drops in when it is over the hole and not moving too fast.

## Structure

```
App.js                    navigation + providers
src/game/physics.js       pure physics (no React), easy to unit test
src/context/              settings provider (persisted)
src/utils/storage.js      AsyncStorage helpers (scores, settings)
src/components/           Skia board, shapes, mascot, background + UI pieces
src/screens/              Home, Game, Results, Leaderboard, Settings, HowToPlay
```

## Building for stores

`app.json` has no icon or splash image yet. Add `icon`, and `ios`/`android` adaptive icon assets, then run `eas build`.
=======
# shake_it_up
>>>>>>> a141641905ec9d94bc2ff1cda8479b169c21a420
