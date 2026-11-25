import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, AppState, BackHandler, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import { useSharedValue } from 'react-native-reanimated';
import Screen from '../components/Screen';
import GameBoard from '../components/GameBoard';
import ArcadeButton from '../components/ArcadeButton';
import { useSettings } from '../context/SettingsContext';
import { addScore } from '../utils/storage';
import { bump, celebrate } from '../utils/haptics';
import { BASKET_POINTS, createSim, pushTrail, stepPop, stepSim, stepSink } from '../game/physics';
import { colors } from '../theme';

const READY_MS = 3000; // 3-2-1 countdown
const CALIBRATE_FROM_MS = 1500; // sensor samples used as the "neutral" phone position
const LOW_TIME_MS = 10000;

function StatCard({ label, value, color, scale }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Animated.Text style={[styles.statValue, { color }, scale ? { transform: [{ scale }] } : null]}>
        {value}
      </Animated.Text>
    </View>
  );
}

// Big text that pops in whenever it is mounted (use `key` to replay it).
function PopText({ children, color = colors.yellow, size = 96 }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [scale]);
  return (
    <Animated.Text style={[styles.popText, { color, fontSize: size, transform: [{ scale }] }]}>{children}</Animated.Text>
  );
}

function FloatingPoints({ id, x, y, onDone }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(t, { toValue: 1, duration: 750, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(
      ({ finished }) => {
        if (finished) onDone(id);
      },
    );
  }, [t, id, onDone]);
  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.floating,
        {
          left: x - 40,
          top: y - 34,
          opacity: t.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -64] }) },
            { scale: t.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.6, 1.3, 1] }) },
          ],
        },
      ]}
    >
      +{BASKET_POINTS}
    </Animated.Text>
  );
}

export default function GameScreen({ navigation }) {
  const { settings } = useSettings();
  const cfg = useRef(settings);
  cfg.current = settings;
  const duration = settings.duration;

  const [board, setBoard] = useState(null);
  const [phase, setPhase] = useState('ready'); // ready | playing | paused | done
  const [countdown, setCountdown] = useState(3);
  const [go, setGo] = useState(false);
  const [score, setScore] = useState(0);
  const [remaining, setRemaining] = useState(duration * 1000);
  const [obstacles, setObstacles] = useState([]);
  const [pops, setPops] = useState([]);
  const [sensorOk, setSensorOk] = useState(true);

  const phaseRef = useRef('ready');
  const simRef = useRef(null);
  const mounted = useRef(true);
  const sensor = useRef({ x: 0, y: 0, z: 0, has: false });
  const meta = useRef({
    last: null,
    readyStart: 0,
    endAt: 0,
    pausedAt: 0,
    prevPhase: 'ready',
    shownCount: 3,
    lastBucket: -1,
    lastHaptic: 0,
    frame: 0,
    popId: 0,
    cN: 0,
    cX: 0,
    cY: 0,
    cZ: 0,
    baseX: 0,
    baseY: 0,
    fx: 0,
    fy: 0,
    conv: 1,
  });

  // Shared values read by the Skia canvas.
  const ballX = useSharedValue(-100);
  const ballY = useSharedValue(-100);
  const ballScale = useSharedValue(0);
  const basketX = useSharedValue(-100);
  const basketY = useSharedValue(-100);
  const basketScale = useSharedValue(0);
  const trail = useSharedValue([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  const scoreScale = useRef(new Animated.Value(1)).current;

  const syncViews = useCallback(
    (sim) => {
      ballX.value = sim.x;
      ballY.value = sim.y;
      ballScale.value = sim.ballScale;
      basketX.value = sim.basket.x;
      basketY.value = sim.basket.y;
      basketScale.value = sim.basketScale;
    },
    [ballX, ballY, ballScale, basketX, basketY, basketScale],
  );

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ---- Accelerometer -------------------------------------------------------
  useEffect(() => {
    let subscription = null;
    let cancelled = false;
    (async () => {
      let available = false;
      try {
        available = await Accelerometer.isAvailableAsync();
      } catch {
        available = false;
      }
      if (cancelled) return;
      if (!available) {
        setSensorOk(false);
        return;
      }
      Accelerometer.setUpdateInterval(16);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const s = sensor.current;
        s.x = x;
        s.y = y;
        s.z = z;
        s.has = true;
      });
    })();
    return () => {
      cancelled = true;
      if (subscription) subscription.remove();
    };
  }, []);

  // ---- Pause / resume / quit ----------------------------------------------
  const pause = useCallback(() => {
    const p = phaseRef.current;
    if (p !== 'playing' && p !== 'ready') return;
    meta.current.prevPhase = p;
    meta.current.pausedAt = Date.now();
    phaseRef.current = 'paused';
    setPhase('paused');
  }, []);

  const resume = useCallback(() => {
    if (phaseRef.current !== 'paused') return;
    const m = meta.current;
    const gap = Date.now() - m.pausedAt;
    m.endAt += gap;
    m.readyStart += gap;
    m.last = null;
    phaseRef.current = m.prevPhase;
    setPhase(m.prevPhase);
  }, []);

  const quit = useCallback(() => {
    phaseRef.current = 'done';
    navigation.popToTop();
  }, [navigation]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pause();
    });
    return () => sub.remove();
  }, [pause]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (phaseRef.current === 'paused') quit();
      else pause();
      return true;
    });
    return () => sub.remove();
  }, [pause, quit]);

  // ---- Board measured: build the simulation --------------------------------
  const onBoardLayout = useCallback(
    (event) => {
      const { width, height } = event.nativeEvent.layout;
      if (simRef.current || width < 100 || height < 100) return;
      const sim = createSim(width, height);
      simRef.current = sim;
      meta.current.readyStart = Date.now();
      syncViews(sim);
      trail.value = sim.trail.slice();
      setObstacles(sim.obstacles.slice());
      setBoard({ w: width, h: height });
    },
    [syncViews, trail],
  );

  // ---- Finish ----------------------------------------------------------------
  const finish = useCallback(() => {
    if (phaseRef.current === 'done') return;
    phaseRef.current = 'done';
    setPhase('done');
    setRemaining(0);
    const finalScore = simRef.current ? simRef.current.score : 0;
    const finalDuration = cfg.current.duration;
    Promise.all([
      addScore({ score: finalScore, duration: finalDuration }),
      new Promise((resolve) => setTimeout(resolve, 1000)),
    ]).then(([result]) => {
      if (!mounted.current) return;
      navigation.replace('Results', {
        score: finalScore,
        duration: finalDuration,
        best: result.best,
        isNewBest: result.isNewBest,
        rank: result.rank,
      });
    });
  }, [navigation]);

  // ---- Main loop -------------------------------------------------------------
  useEffect(() => {
    let raf = 0;

    const startPlaying = (now) => {
      const m = meta.current;
      const s = sensor.current;
      const n = m.cN;
      m.baseX = n ? m.cX / n : s.x;
      m.baseY = n ? m.cY / n : s.y;
      const zAvg = n ? m.cZ / n : s.z;
      // iOS reports gravity with the screen-up z axis at -1, Android at +1. Reading the
      // sign of z while the player holds the phone tells us which convention we get.
      if (Math.abs(zAvg) > 0.15) m.conv = zAvg < 0 ? 1 : -1;
      else m.conv = Platform.OS === 'android' ? -1 : 1;
      m.fx = 0;
      m.fy = 0;
      m.endAt = now + cfg.current.duration * 1000;
      m.lastBucket = -1;
      phaseRef.current = 'playing';
      setPhase('playing');
      setGo(true);
      setTimeout(() => {
        if (mounted.current) setGo(false);
      }, 700);
    };

    const tickReady = (sim, dt, now) => {
      const m = meta.current;
      const s = sensor.current;
      const elapsed = now - m.readyStart;
      if (elapsed > CALIBRATE_FROM_MS && s.has) {
        m.cN += 1;
        m.cX += s.x;
        m.cY += s.y;
        m.cZ += s.z;
      }
      const c = Math.max(1, 3 - Math.floor(elapsed / 1000));
      if (c !== m.shownCount) {
        m.shownCount = c;
        setCountdown(c);
      }
      stepPop(sim, dt);
      if (elapsed >= READY_MS) startPlaying(now);
    };

    const tickPlaying = (sim, dt, now) => {
      const m = meta.current;
      const s = sensor.current;
      const c = cfg.current;

      // Tilt relative to the neutral pose, low-pass filtered against sensor jitter.
      m.fx += (s.x - m.baseX - m.fx) * 0.3;
      m.fy += (s.y - m.baseY - m.fy) * 0.3;
      const dir = m.conv * (c.invertControls ? -1 : 1);
      const tilt = { x: dir * m.fx, y: -dir * m.fy };

      if (sim.sink) {
        const result = stepSink(sim, dt);
        if (result.done) {
          if (result.newBumper) setObstacles(sim.obstacles.slice());
          trail.value = sim.trail.slice();
        }
      } else {
        const out = stepSim(sim, dt, tilt, c.sensitivity);
        if (out.impact > 300 && now - m.lastHaptic > 150) {
          m.lastHaptic = now;
          if (c.haptics) bump();
        }
        if (out.captured) {
          setScore(sim.score);
          if (c.haptics) celebrate();
          m.popId += 1;
          const id = m.popId;
          setPops((list) => [...list, { id, x: sim.basket.x, y: sim.basket.y }]);
        } else {
          stepPop(sim, dt);
          m.frame += 1;
          if (m.frame % 3 === 0) {
            pushTrail(sim);
            trail.value = sim.trail.slice();
          }
        }
      }

      const left = Math.max(0, m.endAt - now);
      const bucket = Math.ceil(left / 100);
      if (bucket !== m.lastBucket) {
        m.lastBucket = bucket;
        setRemaining(left);
      }
      if (left <= 0) finish();
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      const sim = simRef.current;
      if (!sim) return;
      const m = meta.current;
      const phaseNow = phaseRef.current;
      if (phaseNow === 'paused' || phaseNow === 'done') {
        m.last = null;
        return;
      }
      const now = Date.now();
      if (m.last == null) {
        m.last = now;
        return;
      }
      const dt = Math.min((now - m.last) / 1000, 0.033);
      m.last = now;
      if (phaseNow === 'ready') tickReady(sim, dt, now);
      else tickPlaying(sim, dt, now);
      syncViews(sim);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [finish, syncViews, trail]);

  // Score pulse
  useEffect(() => {
    if (score === 0) return;
    Animated.sequence([
      Animated.timing(scoreScale, { toValue: 1.3, duration: 90, useNativeDriver: true }),
      Animated.spring(scoreScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [score, scoreScale]);

  const removePop = useCallback((id) => setPops((list) => list.filter((p) => p.id !== id)), []);

  const seconds = Math.ceil(remaining / 1000);
  const low = remaining <= LOW_TIME_MS && phase !== 'ready';
  const fraction = Math.max(0, Math.min(1, remaining / (duration * 1000)));
  const barColor = low ? colors.pink : colors.cyan;

  return (
    <Screen>
      <View style={styles.hud}>
        <StatCard label="SCORE" value={score} color={colors.yellow} scale={scoreScale} />
        <StatCard label="TIME" value={`${seconds}s`} color={low ? colors.pink : colors.cyan} />
        <ArcadeButton
          title="II"
          size="small"
          color="purple"
          onPress={pause}
          disabled={phase !== 'playing' && phase !== 'ready'}
          style={styles.pauseButton}
        />
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fraction * 100}%`, backgroundColor: barColor }]} />
      </View>

      <View style={styles.boardWrap} onLayout={onBoardLayout}>
        {board ? (
          <GameBoard
            width={board.w}
            height={board.h}
            ballX={ballX}
            ballY={ballY}
            ballScale={ballScale}
            basketX={basketX}
            basketY={basketY}
            basketScale={basketScale}
            trail={trail}
            obstacles={obstacles}
          />
        ) : null}

        {pops.map((p) => (
          <FloatingPoints key={p.id} id={p.id} x={p.x} y={p.y} onDone={removePop} />
        ))}

        {board && phase === 'ready' ? (
          <View style={styles.overlayLight} pointerEvents="none">
            <PopText key={countdown}>{countdown}</PopText>
            <Text style={styles.hint}>Hold your phone comfortably and keep it steady</Text>
          </View>
        ) : null}

        {go ? (
          <View style={styles.overlayLight} pointerEvents="none">
            <PopText color={colors.lime} size={84}>
              GO!
            </PopText>
          </View>
        ) : null}

        {phase === 'done' ? (
          <View style={styles.overlay} pointerEvents="none">
            <PopText color={colors.pink} size={52}>
              TIME'S UP!
            </PopText>
          </View>
        ) : null}

        {phase === 'paused' ? (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>PAUSED</Text>
            <View style={styles.overlayButtons}>
              <ArcadeButton title="Resume" icon="▶" color="cyan" onPress={resume} />
              <View style={{ height: 14 }} />
              <ArcadeButton title="Quit" icon="🏠" color="pink" size="small" onPress={quit} />
            </View>
          </View>
        ) : null}

        {!sensorOk ? (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>No accelerometer</Text>
            <Text style={styles.overlayText}>
              This device does not report motion data. Run Shake It Up on a real phone to play.
            </Text>
            <View style={styles.overlayButtons}>
              <ArcadeButton title="Back" color="purple" size="small" onPress={quit} />
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    paddingVertical: 6,
    alignItems: 'center',
    marginRight: 10,
  },
  statLabel: { color: colors.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  statValue: { fontSize: 32, fontWeight: '900' },
  pauseButton: { width: 70 },
  track: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 5 },
  boardWrap: {
    flex: 1,
    margin: 16,
    borderRadius: 28,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,10,40,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overlayLight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18,10,40,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    color: colors.yellow,
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  overlayText: { color: colors.textDim, fontSize: 16, textAlign: 'center', marginBottom: 8 },
  overlayButtons: { width: '80%', marginTop: 12 },
  popText: {
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 0,
    textAlign: 'center',
  },
  hint: { color: colors.white, fontSize: 15, fontWeight: '700', marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
  floating: {
    position: 'absolute',
    width: 80,
    textAlign: 'center',
    color: colors.lime,
    fontSize: 30,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
});
