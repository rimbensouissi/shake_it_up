import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Background from './Background';
import { colors } from '../theme';

/** Common frame of every screen: animated Skia background + safe area. */
export default function Screen({ children, style }) {
  return (
    <View style={styles.root}>
      <Background />
      <SafeAreaView style={[styles.safe, style]}>{children}</SafeAreaView>
      <StatusBar style="light" />
    </View>
  );
}

/** Title bar with a round back button. */
export function ScreenHeader({ title, onBack, right }) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
      >
        <Text style={styles.backIcon}>←</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  back: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { transform: [{ scale: 0.92 }], backgroundColor: 'rgba(255,255,255,0.18)' },
  backIcon: { color: colors.white, fontSize: 24, fontWeight: '900' },
  title: {
    flex: 1,
    textAlign: 'center',
    color: colors.yellow,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
    textShadowColor: colors.orangeDark,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  right: { width: 46, alignItems: 'flex-end' },
});
