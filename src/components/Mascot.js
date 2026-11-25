import React, { useEffect } from 'react';
import { Canvas, Circle, Group, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { BallShape, BasketShape } from './Shapes';

/** Looping illustration: the smiley ball hops across the floor and drops into the basket. */
export default function Mascot({ width = 240, height = 150 }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.linear }), -1, false);
  }, [t]);

  const startX = width * 0.2;
  const endX = width * 0.74;
  const floorY = height * 0.58;

  const ballTransform = useDerivedValue(() => {
    const p = t.value;
    const run = Math.min(1, p / 0.88);
    const x = startX + (endX - startX) * run;
    const hop = Math.abs(Math.sin(run * Math.PI * 3)) * 46 * (1 - run * 0.5);
    const sink = p > 0.88 ? (p - 0.88) / 0.12 : 0;
    return [{ translateX: x }, { translateY: floorY - hop }, { scale: 1 - sink * 0.85 }];
  });

  const shadowTransform = useDerivedValue(() => {
    const p = t.value;
    const run = Math.min(1, p / 0.88);
    const x = startX + (endX - startX) * run;
    const hop = Math.abs(Math.sin(run * Math.PI * 3)) * 46 * (1 - run * 0.5);
    const sink = p > 0.88 ? (p - 0.88) / 0.12 : 0;
    const s = Math.max(0.05, (1 - hop / 70) * (1 - sink));
    return [{ translateX: x }, { translateY: floorY + 18 }, { scaleX: s }, { scaleY: s * 0.35 }];
  });

  return (
    <Canvas style={{ width, height }}>
      <RoundedRect x={4} y={height * 0.28} width={width - 8} height={height * 0.62} r={26}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['#4A33B0', '#2B1A70']} />
      </RoundedRect>
      <RoundedRect
        x={4}
        y={height * 0.28}
        width={width - 8}
        height={height * 0.62}
        r={26}
        style="stroke"
        strokeWidth={3}
        color="rgba(255,255,255,0.3)"
      />
      <Group transform={[{ translateX: endX }, { translateY: floorY }]}>
        <BasketShape r={30} />
      </Group>
      <Group transform={shadowTransform}>
        <Circle cx={0} cy={0} r={14} color="rgba(0,0,0,0.3)" />
      </Group>
      <Group transform={ballTransform}>
        <BallShape r={17} />
      </Group>
    </Canvas>
  );
}
