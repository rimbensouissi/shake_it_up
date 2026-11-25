import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

/** Pill-shaped option picker. options: [{ label, value }] */
export default function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.row}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.item, selected && styles.itemSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 999,
    padding: 4,
  },
  item: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  itemSelected: { backgroundColor: colors.cyan },
  label: { color: colors.textDim, fontSize: 16, fontWeight: '800' },
  labelSelected: { color: '#06312E' },
});
