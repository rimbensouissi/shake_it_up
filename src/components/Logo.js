import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

/** Chunky arcade wordmark with a gentle wobble. */
export default function Logo({ size = 54 }) {
  const wobble = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(wobble, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wobble, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [wobble]);

  const rotate = wobble.interpolate({ inputRange: [0, 1], outputRange: ['-6deg', '-3deg'] });

  return (
    <Animated.View style={[styles.wrap, { transform: [{ rotate }] }]}>
      <Text style={[styles.line, styles.top, { fontSize: size }]}>SHAKE</Text>
      <Text style={[styles.line, styles.bottom, { fontSize: size * 0.86 }]}>IT UP!</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  line: {
    fontWeight: '900',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 5 },
    textShadowRadius: 0,
  },
  top: { color: colors.yellow, textShadowColor: colors.orangeDark },
  bottom: { color: colors.pink, textShadowColor: colors.pinkDark, marginTop: -6 },
});
