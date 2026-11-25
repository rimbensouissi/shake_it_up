import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import Screen, { ScreenHeader } from '../components/Screen';
import ArcadeButton from '../components/ArcadeButton';
import LevelMeter from '../components/LevelMeter';
import Segmented from '../components/Segmented';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { colors } from '../theme';

const DURATIONS = [30, 45, 60, 90, 120].map((value) => ({ value, label: `${value}s` }));

function Card({ title, subtitle, right, children }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitles}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

function Toggle({ value, onChange }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: 'rgba(255,255,255,0.2)', true: colors.cyan }}
      thumbColor={colors.white}
    />
  );
}

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings } = useSettings();

  return (
    <Screen>
      <ScreenHeader title="SETTINGS" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card
          title="Sensor sensitivity"
          subtitle="How strongly the ball reacts when you tilt the phone"
          right={<Text style={styles.value}>{settings.sensitivity}</Text>}
        >
          <LevelMeter value={settings.sensitivity} onChange={(sensitivity) => updateSettings({ sensitivity })} />
          <View style={styles.scale}>
            <Text style={styles.scaleText}>Calm</Text>
            <Text style={styles.scaleText}>Wild</Text>
          </View>
        </Card>

        <Card title="Game duration" subtitle="Length of one round">
          <Segmented options={DURATIONS} value={settings.duration} onChange={(duration) => updateSettings({ duration })} />
        </Card>

        <Card
          title="Vibration"
          subtitle="Haptic feedback on bumps and baskets"
          right={<Toggle value={settings.haptics} onChange={(haptics) => updateSettings({ haptics })} />}
        />

        <Card
          title="Invert controls"
          subtitle="Turn on if the ball rolls the wrong way on your phone"
          right={<Toggle value={settings.invertControls} onChange={(invertControls) => updateSettings({ invertControls })} />}
        />

        <View style={styles.reset}>
          <ArcadeButton
            title="Reset to defaults"
            icon="↺"
            color="purple"
            size="small"
            onPress={() => updateSettings(DEFAULT_SETTINGS)}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitles: { flex: 1, marginRight: 12, marginBottom: 2 },
  cardTitle: { color: colors.white, fontSize: 19, fontWeight: '900' },
  cardSubtitle: { color: colors.textDim, fontSize: 13, fontWeight: '600', marginTop: 2, marginBottom: 6 },
  value: { color: colors.pink, fontSize: 34, fontWeight: '900' },
  scale: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 56 },
  scaleText: { color: colors.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  reset: { alignItems: 'center', marginTop: 6, paddingHorizontal: 40 },
});
