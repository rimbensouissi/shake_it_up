import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../components/Screen';
import Logo from '../components/Logo';
import Mascot from '../components/Mascot';
import ArcadeButton from '../components/ArcadeButton';
import { getBestScore } from '../utils/storage';
import { colors } from '../theme';

export default function HomeScreen({ navigation }) {
  const [best, setBest] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getBestScore().then((value) => {
        if (alive) setBest(value);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Mascot />
        <View style={styles.logo}>
          <Logo />
        </View>

        <View style={styles.best}>
          <Text style={styles.bestIcon}>🏆</Text>
          <Text style={styles.bestLabel}>BEST</Text>
          <Text style={styles.bestValue}>{best}</Text>
        </View>

        <View style={styles.buttons}>
          <ArcadeButton title="Start Game" icon="🎮" color="yellow" onPress={() => navigation.navigate('Game')} />
          <ArcadeButton title="Leaderboard" icon="🏆" color="cyan" onPress={() => navigation.navigate('Leaderboard')} />
          <ArcadeButton title="How to Play" icon="❓" color="purple" onPress={() => navigation.navigate('HowToPlay')} />
          <ArcadeButton title="Settings" icon="⚙️" color="pink" onPress={() => navigation.navigate('Settings')} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 20,
  },
  logo: { marginTop: 8, marginBottom: 14 },
  best: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 22,
  },
  bestIcon: { fontSize: 20, marginRight: 8 },
  bestLabel: { color: colors.textDim, fontSize: 14, fontWeight: '800', letterSpacing: 2, marginRight: 10 },
  bestValue: { color: colors.yellow, fontSize: 24, fontWeight: '900' },
  buttons: { width: '100%', maxWidth: 360, gap: 6 },
});
