import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Canvas, Group, RoundedRect } from '@shopify/react-native-skia';
import { useDerivedValue, useSharedValue, withTiming, Easing as REasing } from 'react-native-reanimated';
import Screen from '../components/Screen';
import ArcadeButton from '../components/ArcadeButton';
import { colors } from '../theme';

const CONFETTI_COLORS = [colors.pink, colors.yellow, colors.cyan, colors.lime, colors.orange, colors.purple];

function Piece({ piece, progress }) {
  const transform = useDerivedValue(() => {
    const t = progress.value;
    return [
      { translateX: piece.x0 + piece.vx * t },
      { translateY: piece.y0 + piece.vy * t + 900 * t * t },
      { rotate: piece.rot + piece.spin * t },
    ];
  });
  const opacity = useDerivedValue(() => 1 - Math.max(0, (progress.value - 0.7) / 0.3));
  return (
    <Group transform={transform} opacity={opacity}>
      <RoundedRect x={-6} y={-3.5} width={12} height={7} r={2} color={piece.color} />
    </Group>
  );
}

function Confetti() {
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(0);
  const pieces = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => ({
        x0: width / 2,
        y0: height * 0.32,
        vx: (Math.random() - 0.5) * width * 1.1,
        vy: -300 - Math.random() * 420,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 14,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [width, height],
  );

  useEffect(() => {
    progress.value = withTiming(1, { duration: 2400, easing: REasing.out(REasing.quad) });
  }, [progress]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece, i) => (
        <Piece key={i} piece={piece} progress={progress} />
      ))}
    </Canvas>
  );
}

function tagline(score) {
  if (score === 0) return 'Shake harder next time!';
  if (score < 40) return 'Warming up!';
  if (score < 90) return 'Nice moves!';
  if (score < 150) return 'Arcade hero!';
  return 'Shake legend!';
}

export default function ResultsScreen({ navigation, route }) {
  const { score = 0, duration = 60, best = 0, isNewBest = false, rank = null } = route.params || {};
  const [shown, setShown] = useState(0);
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const badgePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();

    const counter = new Animated.Value(0);
    const id = counter.addListener(({ value }) => setShown(Math.round(value)));
    Animated.timing(counter, {
      toValue: score,
      duration: Math.min(1400, 400 + score * 8),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    let pulse = null;
    if (isNewBest) {
      pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulse, { toValue: 1.12, duration: 500, useNativeDriver: true }),
          Animated.timing(badgePulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        ]),
      );
      pulse.start();
    }
    return () => {
      counter.removeListener(id);
      if (pulse) pulse.stop();
    };
  }, [score, isNewBest, cardScale, badgePulse]);

  return (
    <Screen>
      {isNewBest ? <Confetti /> : null}
      <View style={styles.content}>
        <Text style={styles.heading}>GAME OVER</Text>

        <Animated.View style={[styles.card, { transform: [{ scale: cardScale }] }]}>
          <Text style={styles.trophy}>{isNewBest ? '🏆' : '🎯'}</Text>
          <Text style={styles.label}>FINAL SCORE</Text>
          <Text style={styles.score}>{shown}</Text>
          <Text style={styles.tagline}>{tagline(score)}</Text>

          {isNewBest ? (
            <Animated.View style={[styles.badge, { transform: [{ scale: badgePulse }] }]}>
              <Text style={styles.badgeText}>NEW BEST!</Text>
            </Animated.View>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>BEST SCORE</Text>
              <Text style={styles.statValue}>{Math.max(best, score)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ROUND</Text>
              <Text style={styles.statValue}>{duration}s</Text>
            </View>
          </View>

          {rank ? <Text style={styles.rank}>You are #{rank} on the leaderboard</Text> : null}
        </Animated.View>

        <View style={styles.buttons}>
          <ArcadeButton title="Play Again" icon="🔁" color="yellow" onPress={() => navigation.replace('Game')} />
          <ArcadeButton title="Leaderboard" icon="🏆" color="cyan" size="small" onPress={() => navigation.navigate('Leaderboard')} />
          <ArcadeButton title="Home" icon="🏠" color="purple" size="small" onPress={() => navigation.popToTop()} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  heading: {
    color: colors.pink,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: colors.pinkDark,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
    marginBottom: 18,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 32,
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  trophy: { fontSize: 54 },
  label: { color: colors.textDim, fontSize: 14, fontWeight: '800', letterSpacing: 3, marginTop: 4 },
  score: {
    color: colors.yellow,
    fontSize: 84,
    fontWeight: '900',
    textShadowColor: colors.orangeDark,
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 0,
  },
  tagline: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: 2 },
  badge: {
    backgroundColor: colors.lime,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 12,
  },
  badgeText: { color: '#10400B', fontWeight: '900', letterSpacing: 2, fontSize: 15 },
  divider: { height: 2, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
  statsRow: { flexDirection: 'row', alignSelf: 'stretch' },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { color: colors.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  statValue: { color: colors.cyan, fontSize: 28, fontWeight: '900' },
  rank: { color: colors.white, fontSize: 15, fontWeight: '700', marginTop: 14 },
  buttons: { width: '100%', maxWidth: 380, marginTop: 24, gap: 6 },
});
