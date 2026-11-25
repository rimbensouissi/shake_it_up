import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { buttonPalette } from '../theme';

/** Rounded "3D" arcade button that sinks when pressed. */
export default function ArcadeButton({ title, icon, onPress, color = 'pink', size = 'large', disabled = false, style }) {
  const press = useRef(new Animated.Value(0)).current;
  const palette = buttonPalette[color] || buttonPalette.pink;
  const depth = size === 'large' ? 8 : 5;
  const height = size === 'large' ? 62 : 48;

  const animateTo = (value) =>
    Animated.spring(press, { toValue: value, useNativeDriver: true, speed: 40, bounciness: 4 }).start();

  const translateY = press.interpolate({ inputRange: [0, 1], outputRange: [0, depth - 2] });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(1)}
      onPressOut={() => animateTo(0)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[{ opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View style={[styles.edge, { backgroundColor: palette.edge, paddingBottom: depth }]}>
        <Animated.View
          style={[styles.face, { backgroundColor: palette.face, height, transform: [{ translateY }] }]}
        >
          <View style={styles.shine} />
          {icon ? <Text style={[styles.icon, size !== 'large' && styles.iconSmall]}>{icon}</Text> : null}
          <Text style={[styles.label, size !== 'large' && styles.labelSmall, { color: palette.text }]}>{title}</Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  edge: { borderRadius: 999 },
  face: {
    borderRadius: 999,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    top: 5,
    left: 22,
    right: 22,
    height: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  icon: { fontSize: 26, marginRight: 10 },
  iconSmall: { fontSize: 20, marginRight: 8 },
  label: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  labelSmall: { fontSize: 17 },
});
