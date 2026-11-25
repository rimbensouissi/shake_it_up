import AsyncStorage from '@react-native-async-storage/async-storage';

const SCORES_KEY = '@shakeitup/scores';
const SETTINGS_KEY = '@shakeitup/settings';
const MAX_SCORES = 20;

export const DEFAULT_SETTINGS = {
  sensitivity: 5, // 1 (calm) .. 10 (wild)
  duration: 60, // seconds
  invertControls: false,
  haptics: true,
};

async function readJSON(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJSON(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is best-effort: the game stays playable if it fails.
  }
}

const byScoreThenDate = (a, b) =>
  b.score - a.score || new Date(b.date).getTime() - new Date(a.date).getTime();

// ---------- Settings ----------

export async function loadSettings() {
  const saved = await readJSON(SETTINGS_KEY, {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(settings) {
  return writeJSON(SETTINGS_KEY, settings);
}

// ---------- Scores ----------

export async function getScores() {
  const list = await readJSON(SCORES_KEY, []);
  return Array.isArray(list) ? [...list].sort(byScoreThenDate) : [];
}

export async function getBestScore() {
  const list = await getScores();
  return list.length ? list[0].score : 0;
}

/**
 * Stores a finished game. Returns the best score, whether this run beat it
 * and the rank of the run on the leaderboard (null if it did not make it).
 */
export async function addScore({ score, duration }) {
  const previous = await getScores();
  const previousBest = previous.length ? previous[0].score : 0;

  if (score <= 0) {
    return { best: previousBest, isNewBest: false, rank: null };
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    score,
    duration,
    date: new Date().toISOString(),
  };
  const next = [...previous, entry].sort(byScoreThenDate).slice(0, MAX_SCORES);
  await writeJSON(SCORES_KEY, next);

  const index = next.findIndex((e) => e.id === entry.id);
  return {
    best: Math.max(previousBest, score),
    isNewBest: score > previousBest,
    rank: index >= 0 ? index + 1 : null,
  };
}

export async function clearScores() {
  try {
    await AsyncStorage.removeItem(SCORES_KEY);
  } catch {
    // ignore
  }
}
