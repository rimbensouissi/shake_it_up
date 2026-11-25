import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

function RoundButton({ label, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label === '+' ? 'Increase' : 'Decrease'}
      style={({ pressed }) => [styles.round, disabled && styles.roundDisabled, pressed && styles.roundPressed]}
    >
      <Text style={styles.roundLabel}>{label}</Text>
    </Pressable>
  );
}

/** 1..max level picker made of tappable bars with − / + buttons. */
export default function LevelMeter({ value, min = 1, max = 10, onChange }) {
  const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View style={styles.row}>
      <RoundButton label="−" onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} />
      <View style={styles.bars}>
        {levels.map((level, i) => (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            hitSlop={{ top: 12, bottom: 12 }}
            accessibilityRole="button"
            accessibilityLabel={`Level ${level}`}
            style={[
              styles.bar,
              { height: 14 + i * 4 },
              { backgroundColor: level <= value ? colors.pink : 'rgba(255,255,255,0.16)' },
            ]}
          />
        ))}
      </View>
      <RoundButton label="+" onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginHorizontal: 12, height: 52 },
  bar: { width: '8%', borderRadius: 6 },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundPressed: { transform: [{ scale: 0.92 }] },
  roundDisabled: { opacity: 0.4 },
  roundLabel: { color: colors.white, fontSize: 26, fontWeight: '900', marginTop: -2 },
});
