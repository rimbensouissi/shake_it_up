import * as Haptics from 'expo-haptics';

// Tiny safe wrappers: haptics are a bonus and must never crash the game.
export function bump() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {
    // ignore
  }
}

export function celebrate() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // ignore
  }
}
