import React, { memo, useMemo } from 'react';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Path,
  RadialGradient,
  RoundedRect,
  vec,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';
import { BallShape, BasketShape } from './Shapes';
import { BALL_R, BASKET_R, TRAIL_COUNT } from '../game/physics';
import { colors } from '../theme';

function gridPath(w, h, step) {
  let d = '';
  for (let x = step; x < w; x += step) d += `M ${x} 0 L ${x} ${h} `;
  for (let y = step; y < h; y += step) d += `M 0 ${y} L ${w} ${y} `;
  return d;
}

function Bumper({ x, y, r }) {
  return (
    <Group transform={[{ translateX: x }, { translateY: y }]}>
      <Circle cx={0} cy={0} r={r + 5} color="rgba(255,77,141,0.25)" />
      <Circle cx={0} cy={0} r={r}>
        <RadialGradient c={vec(-r * 0.3, -r * 0.3)} r={r * 1.5} colors={[colors.orange, colors.pinkDark]} />
      </Circle>
      <Circle cx={0} cy={0} r={r} style="stroke" strokeWidth={2} color="rgba(255,255,255,0.35)" />
      <Circle cx={-r * 0.32} cy={-r * 0.34} r={r * 0.2} color="rgba(255,255,255,0.6)" />
    </Group>
  );
}

// One faded copy of the ball; `trail` is a shared array [x0, y0, x1, y1, ...].
function TrailDot({ index, trail }) {
  const transform = useDerivedValue(() => [
    { translateX: trail.value[index * 2] },
    { translateY: trail.value[index * 2 + 1] },
  ]);
  const fade = 1 - index / TRAIL_COUNT;
  return (
    <Group transform={transform}>
      <Circle cx={0} cy={0} r={BALL_R * (0.9 - index * 0.08)} color={colors.yellow} opacity={0.3 * fade} />
    </Group>
  );
}

const TRAIL_INDEXES = Array.from({ length: TRAIL_COUNT }, (_, i) => i);

/**
 * Skia playfield. Ball, basket and trail are driven by Reanimated shared values,
 * so they move every frame without re-rendering React.
 */
function GameBoard({ width, height, ballX, ballY, ballScale, basketX, basketY, basketScale, trail, obstacles }) {
  const ballTransform = useDerivedValue(() => [
    { translateX: ballX.value },
    { translateY: ballY.value },
    { scale: ballScale.value },
  ]);
  const basketTransform = useDerivedValue(() => [
    { translateX: basketX.value },
    { translateY: basketY.value },
    { scale: basketScale.value },
  ]);
  const grid = useMemo(() => gridPath(width, height, 32), [width, height]);

  return (
    <Canvas style={{ width, height }}>
      <RoundedRect x={0} y={0} width={width} height={height} r={28}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['#3E2C9A', '#241563']} />
      </RoundedRect>
      <Path path={grid} style="stroke" strokeWidth={1} color="rgba(255,255,255,0.06)" />

      {obstacles.map((o) => (
        <Bumper key={o.id} x={o.x} y={o.y} r={o.r} />
      ))}

      <Group transform={basketTransform}>
        <BasketShape r={BASKET_R} />
      </Group>

      {TRAIL_INDEXES.map((i) => (
        <TrailDot key={`trail-${i}`} index={i} trail={trail} />
      ))}

      <Group transform={ballTransform}>
        <BallShape r={BALL_R} />
      </Group>

      <RoundedRect
        x={2}
        y={2}
        width={width - 4}
        height={height - 4}
        r={27}
        style="stroke"
        strokeWidth={4}
        color="rgba(255,255,255,0.28)"
      />
    </Canvas>
  );
}

export default memo(GameBoard);
