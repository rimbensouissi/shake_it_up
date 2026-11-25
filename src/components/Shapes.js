import React from 'react';
import { Circle, Group, LinearGradient, Path, RadialGradient, vec } from '@shopify/react-native-skia';
import { colors } from '../theme';

/** The smiley ball. Drawn around (0, 0) so it can be moved with a group transform. */
export function BallShape({ r = 16, face = true }) {
  const smile = `M ${-r * 0.36} ${r * 0.2} Q 0 ${r * 0.58} ${r * 0.36} ${r * 0.2}`;
  return (
    <Group>
      <Circle cx={2} cy={r * 0.32} r={r} color="rgba(0,0,0,0.30)" />
      <Circle cx={0} cy={0} r={r}>
        <RadialGradient
          c={vec(-r * 0.35, -r * 0.4)}
          r={r * 1.7}
          colors={['#FFF3A6', colors.yellow, colors.orange]}
          positions={[0, 0.45, 1]}
        />
      </Circle>
      <Circle cx={0} cy={0} r={r} style="stroke" strokeWidth={2} color="rgba(120,50,0,0.35)" />
      <Circle cx={-r * 0.4} cy={-r * 0.44} r={r * 0.2} color="rgba(255,255,255,0.7)" />
      {face ? (
        <>
          <Circle cx={-r * 0.3} cy={-r * 0.08} r={r * 0.11} color="#4A2200" />
          <Circle cx={r * 0.3} cy={-r * 0.08} r={r * 0.11} color="#4A2200" />
          <Path path={smile} style="stroke" strokeWidth={Math.max(1.5, r * 0.1)} strokeCap="round" color="#4A2200" />
        </>
      ) : null}
    </Group>
  );
}

/** The basket seen from above: glowing rim, dark hole and a net. Centered on (0, 0). */
export function BasketShape({ r = 34 }) {
  return (
    <Group>
      <Circle cx={0} cy={0} r={r + 9} color="rgba(46,230,214,0.18)" />
      <Circle cx={0} cy={0} r={r}>
        <LinearGradient start={vec(-r, -r)} end={vec(r, r)} colors={[colors.cyan, colors.purple]} />
      </Circle>
      <Circle cx={0} cy={0} r={r * 0.78}>
        <RadialGradient c={vec(0, 0)} r={r * 0.8} colors={['#05020F', '#2A1260']} />
      </Circle>
      <Circle cx={0} cy={0} r={r * 0.78} style="stroke" strokeWidth={2} color="rgba(255,255,255,0.38)" />
    </Group>
  );
}