import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Circle, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

// Big soft bubbles that drift slowly. Positions are fractions of the screen.
const BUBBLES = [
  { x: 0.1, y: 0.16, r: 54, color: colors.pink, dur: 5200, amp: 22, delay: 0 },
  { x: 0.88, y: 0.1, r: 38, color: colors.cyan, dur: 4300, amp: 18, delay: 400 },
  { x: 0.78, y: 0.4, r: 64, color: colors.purple, dur: 6100, amp: 26, delay: 900 },
  { x: 0.06, y: 0.52, r: 40, color: colors.yellow, dur: 4700, amp: 20, delay: 200 },
  { x: 0.3, y: 0.82, r: 58, color: colors.cyan, dur: 5600, amp: 24, delay: 700 },
  { x: 0.92, y: 0.84, r: 46, color: colors.pink, dur: 4900, amp: 18, delay: 100 },
];

function Bubble({ x, y, r, color, dur, amp, delay }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [t, delay, dur]);
  const cy = useDerivedValue(() => y + (t.value - 0.5) * amp * 2);
  return <Circle cx={x} cy={cy} r={r} color={color} opacity={0.16} />;
}

// Deterministic little stars so the background does not jump between renders.
function makeStars(count) {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () => ({ x: next(), y: next(), r: 0.8 + next() * 1.6 }));
}

export default function Background() {
  const { width, height } = useWindowDimensions();
  const stars = useMemo(() => makeStars(26), []);
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient start={vec(0, 0)} end={vec(width, height)} colors={[colors.bgLight, colors.bg, colors.bgDeep]} />
      </Rect>
      {stars.map((s, i) => (
        <Circle key={`star-${i}`} cx={s.x * width} cy={s.y * height} r={s.r} color="rgba(255,255,255,0.28)" />
      ))}
      {BUBBLES.map((b, i) => (
        <Bubble key={`bubble-${i}`} {...b} x={b.x * width} y={b.y * height} />
      ))}
    </Canvas>
  );
}
