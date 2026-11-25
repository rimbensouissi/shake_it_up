import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Screen, { ScreenHeader } from '../components/Screen';
import ArcadeButton from '../components/ArcadeButton';
import { BASKET_POINTS } from '../game/physics';
import { useSettings } from '../context/SettingsContext';
import { colors } from '../theme';

export default function HowToPlayScreen({ navigation }) {
  const { settings } = useSettings();

  const steps = [
    { icon: '📱', title: 'Tilt your phone', text: 'The ball rolls like it is on a real tray. Tilt right, left, forward or back. No touching the screen!' },
    { icon: '🧺', title: 'Fill the basket', text: `Guide the ball into the glowing basket to score ${BASKET_POINTS} points. Slow down above it: a ball moving too fast skips over.` },
    { icon: '⏱️', title: 'Beat the clock', text: `You have ${settings.duration} seconds per round. Every basket moves the target somewhere new.` },
    { icon: '💥', title: 'Dodge the bumpers', text: 'Orange bumpers appear as you score. They bounce the ball away, so plan your path.' },
  ];

  return (
    <Screen>
      <ScreenHeader title="HOW TO PLAY" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {steps.map((step, i) => (
          <View key={step.title} style={styles.card}>
            <View style={styles.iconWrap}>
              <Text style={styles.icon}>{step.icon}</Text>
            </View>
            <View style={styles.texts}>
              <Text style={styles.title}>
                {i + 1}. {step.title}
              </Text>
              <Text style={styles.text}>{step.text}</Text>
            </View>
          </View>
        ))}

        <View style={styles.tip}>
          <Text style={styles.tipText}>
            Tip: hold the phone the way you like. The game calibrates to your position during the 3-2-1 countdown.
          </Text>
        </View>

        <View style={styles.buttons}>
          <ArcadeButton title="Let's play!" icon="🎮" color="yellow" onPress={() => navigation.replace('Game')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 24,
    padding: 14,
    marginBottom: 12,
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(139,92,246,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  icon: { fontSize: 30 },
  texts: { flex: 1 },
  title: { color: colors.yellow, fontSize: 18, fontWeight: '900' },
  text: { color: colors.textDim, fontSize: 14, fontWeight: '600', marginTop: 3, lineHeight: 19 },
  tip: {
    backgroundColor: 'rgba(46,230,214,0.12)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(46,230,214,0.35)',
    padding: 14,
    marginTop: 4,
  },
  tipText: { color: colors.cyan, fontSize: 14, fontWeight: '700', lineHeight: 19 },
  buttons: { marginTop: 18, paddingHorizontal: 20 },
});
