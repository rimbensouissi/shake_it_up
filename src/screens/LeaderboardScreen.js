import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Screen, { ScreenHeader } from '../components/Screen';
import ArcadeButton from '../components/ArcadeButton';
import { clearScores, getScores } from '../utils/storage';
import { colors } from '../theme';

const MEDALS = ['🥇', '🥈', '🥉'];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function Row({ item, index }) {
  const top = index < 3;
  return (
    <View style={[styles.row, top && styles.rowTop]}>
      <View style={styles.rank}>
        {top ? <Text style={styles.medal}>{MEDALS[index]}</Text> : <Text style={styles.rankText}>#{index + 1}</Text>}
      </View>
      <View style={styles.info}>
        <Text style={styles.score}>{item.score}</Text>
        <Text style={styles.date}>{formatDate(item.date)}</Text>
      </View>
      <View style={styles.chip}>
        <Text style={styles.chipText}>{item.duration}s</Text>
      </View>
    </View>
  );
}

export default function LeaderboardScreen({ navigation }) {
  const [scores, setScores] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      getScores().then((list) => {
        if (!alive) return;
        setScores(list);
        setLoaded(true);
      });
      return () => {
        alive = false;
      };
    }, []),
  );

  const confirmClear = () => {
    Alert.alert('Clear leaderboard?', 'All saved scores will be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearScores();
          setScores([]);
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScreenHeader title="LEADERBOARD" onBack={() => navigation.goBack()} />
      <FlatList
        data={scores}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <Row item={item} index={index} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loaded ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>No scores yet</Text>
              <Text style={styles.emptyText}>Play a round and your best games will show up here.</Text>
            </View>
          ) : null
        }
      />
      <View style={styles.footer}>
        {scores.length > 0 ? (
          <ArcadeButton title="Clear scores" icon="🗑️" color="pink" size="small" onPress={confirmClear} />
        ) : (
          <ArcadeButton title="Start Game" icon="🎮" color="yellow" size="small" onPress={() => navigation.replace('Game')} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 16, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rowTop: { borderColor: 'rgba(255,210,63,0.6)', backgroundColor: 'rgba(255,210,63,0.1)' },
  rank: { width: 48, alignItems: 'center' },
  medal: { fontSize: 30 },
  rankText: { color: colors.textDim, fontSize: 18, fontWeight: '900' },
  info: { flex: 1, marginLeft: 6 },
  score: { color: colors.yellow, fontSize: 28, fontWeight: '900' },
  date: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  chip: { backgroundColor: 'rgba(46,230,214,0.18)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { color: colors.cyan, fontWeight: '800', fontSize: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingTop: 60 },
  emptyIcon: { fontSize: 70 },
  emptyTitle: { color: colors.white, fontSize: 26, fontWeight: '900', marginTop: 10 },
  emptyText: { color: colors.textDim, fontSize: 16, textAlign: 'center', marginTop: 6 },
  footer: { paddingHorizontal: 40, paddingBottom: 16, paddingTop: 4 },
});
