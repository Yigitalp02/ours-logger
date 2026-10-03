import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ConfettiBurst } from '@/components/ConfettiBurst';
import { PlaceMap } from '@/components/PlaceMap';
import { Button } from '@/components/ui';
import { formatWhen } from '@/lib/format';
import { addedByLabel } from '@/lib/wheel';
import { colors, radius } from '@/theme';
import type { Profile, WheelOption } from '@/types';

type Props = {
  winner: WheelOption | null;
  resultId?: number;
  profiles: Profile[];
  onClose: () => void;
  onOpenPlan: (dateId: string) => void;
  onEdit: (winner: WheelOption) => void;
  onLetsGo: () => void;
  onSpinAgain: () => void;
};

export function SpinResultModal({
  winner,
  resultId = 0,
  profiles,
  onClose,
  onOpenPlan,
  onEdit,
  onLetsGo,
  onSpinAgain,
}: Props) {
  const [scale] = useState(() => new Animated.Value(0.86));
  const [fade] = useState(() => new Animated.Value(0));
  const [mapVisible, setMapVisible] = useState(true);
  const closeRef = useRef(onClose);
  const showMap = Boolean(winner?.place?.lat && winner.place.lng) && mapVisible;

  function finish(action: () => void) {
    setMapVisible(false);
    setTimeout(() => {
      action();
      setMapVisible(true);
    }, 80);
  }

  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!winner) return;
    scale.setValue(0.86);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, scale, winner]);

  useEffect(() => {
    if (!winner) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setMapVisible(false);
      setTimeout(() => {
        closeRef.current();
        setMapVisible(true);
      }, 80);
      return true;
    });
    return () => sub.remove();
  }, [winner]);

  if (!winner) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto" accessibilityViewIsModal>
      <Animated.View style={[styles.panel, { opacity: fade, transform: [{ scale }] }]}>
        <Pressable style={styles.close} onPress={() => finish(onClose)} hitSlop={12} accessibilityLabel="Close result">
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.card}>
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.eyebrow}>You are going to</Text>
            <Text style={styles.name}>{winner.name}</Text>
            {winner.source === 'plan' && winner.planTitle ? (
              <Pressable
                style={styles.planChip}
                onPress={() => winner.dateId && finish(() => onOpenPlan(winner.dateId!))}
              >
                <Ionicons name="bookmark" size={14} color={colors.rose} />
                <Text style={styles.planChipText}>From plan · {winner.planTitle}</Text>
              </Pressable>
            ) : (
              <Text style={styles.customChip}>{addedByLabel(winner.createdBy, profiles)}</Text>
            )}
            {winner.happenedAt ? <Text style={styles.meta}>{formatWhen(winner.happenedAt)}</Text> : null}
            {winner.address ? <Text style={styles.address}>{winner.address}</Text> : null}
            {winner.details ? <Text style={styles.details}>{winner.details}</Text> : null}
            {showMap && winner.place ? <PlaceMap key={resultId || winner.key} place={winner.place} height={180} /> : null}
            {winner.source === 'plan' && winner.dateId ? (
              <Button label="Open this plan" variant="ghost" onPress={() => finish(() => onOpenPlan(winner.dateId!))} />
            ) : null}
            {winner.source === 'custom' && winner.spinPlaceId ? (
              <Button label="Edit this place" variant="ghost" onPress={() => finish(() => onEdit(winner))} />
            ) : null}
          </ScrollView>
          <View style={styles.choiceRow}>
            <Pressable style={[styles.choice, styles.choiceGo]} onPress={() => finish(onLetsGo)}>
              <Text style={styles.choiceGoText}>{"Let's go!"}</Text>
            </Pressable>
            <Pressable style={[styles.choice, styles.choiceAgain]} onPress={() => finish(onSpinAgain)}>
              <Text style={styles.choiceAgainText}>I wanna spin again</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
      <ConfettiBurst key={winner.key} play />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    zIndex: 50,
    elevation: 50,
  },
  panel: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  close: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    zIndex: 2,
  },
  card: {
    flex: 1,
    minHeight: 0,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 20,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardScroll: {
    flex: 1,
  },
  cardBody: {
    gap: 10,
    paddingBottom: 8,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  name: { color: colors.text, fontSize: 28, fontWeight: '800' },
  planChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planChipText: { color: colors.rose, fontWeight: '800' },
  customChip: { color: colors.textMuted, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 14 },
  address: { color: colors.textMuted, lineHeight: 20 },
  details: { color: colors.text, lineHeight: 22, fontSize: 15 },
  choiceRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  choice: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  choiceGo: { backgroundColor: colors.accent },
  choiceAgain: { backgroundColor: colors.danger },
  choiceGoText: { color: colors.bg, fontWeight: '800', fontSize: 15, textAlign: 'center' },
  choiceAgainText: { color: colors.white, fontWeight: '800', fontSize: 15, textAlign: 'center' },
});
