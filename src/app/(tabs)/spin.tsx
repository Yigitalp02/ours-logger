import Ionicons from '@expo/vector-icons/Ionicons';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { IconBurst } from '@/components/IconBurst';
import { PlaceMap } from '@/components/PlaceMap';
import { PlaceSearch } from '@/components/PlaceSearch';
import { SpinResultModal } from '@/components/SpinResultModal';
import { SpinWheel, type SpinWheelHandle } from '@/components/SpinWheel';
import { Button, Field } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { formatShortDate } from '@/lib/format';
import { useKeyboardBottomInset } from '@/lib/keyboard';
import { activeWheelOptions, addedByLabel, buildWheelOptions } from '@/lib/wheel';
import { colors, radius } from '@/theme';
import type { Place, WheelOption } from '@/types';

const spinSound = require('../../../assets/sounds/wheel-spin.wav');
const celebrateSound = require('../../../assets/sounds/celebrate.wav');
const failSound = require('../../../assets/sounds/fail.wav');

export default function SpinScreen() {
  const {
    plannedDates,
    spinPlaces,
    profiles,
    addSpinPlace,
    saveSpinPlace,
    removeSpinPlace,
    wheelExcludedKeys,
    setWheelIncluded,
    error,
  } = useApp();
  const catalog = useMemo(() => buildWheelOptions(plannedDates, spinPlaces), [plannedDates, spinPlaces]);
  const options = useMemo(
    () => activeWheelOptions(catalog, wheelExcludedKeys),
    [catalog, wheelExcludedKeys],
  );
  const wheelRef = useRef<SpinWheelHandle | null>(null);
  const player = useAudioPlayer(spinSound);
  const celebratePlayer = useAudioPlayer(celebrateSound);
  const failPlayer = useAudioPlayer(failSound);

  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<WheelOption | null>(null);
  const [spinHitKey, setSpinHitKey] = useState(0);
  const [resultId, setResultId] = useState(0);
  const [burst, setBurst] = useState<{ kind: 'hearts' | 'skulls'; id: number } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [details, setDetails] = useState('');
  const [place, setPlace] = useState<Place | null>(null);
  const [saving, setSaving] = useState(false);
  const keyboardInset = useKeyboardBottomInset();

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: 'mixWithOthers',
    }).catch(() => undefined);
  }, []);

  function dismissResult() {
    setWinner(null);
    setSpinHitKey((key) => key + 1);
  }

  async function onSpin() {
    if (spinning || options.length === 0) return;
    setSpinning(true);
    setWinner(null);
    player.seekTo(0).then(() => player.play()).catch(() => undefined);
    try {
      const index = await wheelRef.current?.spin();
      player.pause();
      if (index === undefined) return;
      setResultId(Date.now());
      setWinner(options[index]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    } catch (spinError) {
      player.pause();
      if (spinError instanceof Error && spinError.message !== 'Spin cancelled') {
        Alert.alert('Could not spin', spinError.message);
      }
    } finally {
      setSpinning(false);
    }
  }

  function resetEditor() {
    setEditingId(null);
    setName('');
    setDetails('');
    setPlace(null);
  }

  function openAdd() {
    resetEditor();
    setEditorOpen(true);
  }

  function openEdit(item: WheelOption) {
    if (!item.spinPlaceId) return;
    setEditingId(item.spinPlaceId);
    setName(item.name);
    setDetails(item.details);
    setPlace(item.place);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    resetEditor();
  }

  async function onSavePlace() {
    if (!name.trim()) {
      Alert.alert('Name missing', 'Give the place a name so it can land on the wheel.');
      return;
    }
    try {
      setSaving(true);
      if (editingId) {
        await saveSpinPlace(editingId, { name, details, place });
      } else {
        await addSpinPlace({ name, details, place });
      }
      closeEditor();
    } catch (saveError) {
      Alert.alert(
        editingId ? 'Could not save place' : 'Could not add place',
        saveError instanceof Error ? saveError.message : 'Try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function onDeleteCustom(placeId: string) {
    Alert.alert('Remove from the wheel', 'This only deletes the place you added here. Plans stay as they are.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          if (editingId === placeId) closeEditor();
          removeSpinPlace(placeId);
        },
      },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 + keyboardInset }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.lead}>
          Let the wheel pick tonight. It uses places from your plans, plus anything you add here. Uncheck a place to
          leave it off the wheel.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.wheelBlock} pointerEvents="box-none">
          <SpinWheel ref={wheelRef} options={options} />
        </View>

        <TouchableOpacity
          key={spinHitKey}
          activeOpacity={0.85}
          delayPressIn={0}
          disabled={spinning || options.length === 0}
          onPress={onSpin}
          style={[styles.spinButton, (spinning || options.length === 0) && styles.spinButtonDisabled]}
        >
          <Text style={styles.spinButtonText}>
            {spinning ? 'Spinning...' : options.length ? 'Spin the wheel' : 'Add a place first'}
          </Text>
        </TouchableOpacity>

        <View style={styles.sectionHead}>
          <Text style={styles.section}>On the wheel</Text>
          <Pressable style={styles.addLink} onPress={openAdd}>
            <Ionicons name="add" size={18} color={colors.accent} />
            <Text style={styles.addLinkText}>Add a place</Text>
          </Pressable>
        </View>

        {catalog.length ? (
          catalog.map((item) => {
            const onWheel = !wheelExcludedKeys.includes(item.key);
            return (
              <View key={item.key} style={[styles.row, !onWheel && styles.rowOff]}>
                <Pressable
                  onPress={() => {
                    setWheelIncluded(item.key, !onWheel).catch((updateError) => {
                      Alert.alert(
                        'Could not update the wheel',
                        updateError instanceof Error ? updateError.message : 'Try again.',
                      );
                    });
                  }}
                  hitSlop={8}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: onWheel }}
                  accessibilityLabel={onWheel ? 'On the wheel' : 'Off the wheel'}
                >
                  <Ionicons
                    name={onWheel ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={onWheel ? colors.accent : colors.textMuted}
                  />
                </Pressable>
                <Pressable
                  style={styles.rowMeta}
                  onPress={() => {
                    if (item.source === 'custom') openEdit(item);
                    else if (item.dateId) router.push(`/date/${item.dateId}`);
                  }}
                >
                  <Text style={styles.rowName}>{item.name}</Text>
                  <Text style={styles.rowSub}>{addedByLabel(item.createdBy, profiles)}</Text>
                  {item.createdAt ? <Text style={styles.rowSub}>Added {formatShortDate(item.createdAt)}</Text> : null}
                  {item.address ? <Text style={styles.rowSub}>{item.address}</Text> : null}
                </Pressable>
                {item.source === 'custom' && item.spinPlaceId ? (
                  <View style={styles.rowActions}>
                    <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                      <Ionicons name="create-outline" size={20} color={colors.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => onDeleteCustom(item.spinPlaceId!)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ) : item.dateId ? (
                  <Pressable onPress={() => router.push(`/date/${item.dateId}`)}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
                  </Pressable>
                ) : null}
              </View>
            );
          })
        ) : (
          <EmptyState
            title="Nothing on the wheel yet"
            body="Save a plan with a place, or add a restaurant here. Then spin to pick where you go."
          />
        )}
      </ScrollView>

      <SpinResultModal
        winner={winner}
        resultId={resultId}
        profiles={profiles}
        onClose={dismissResult}
        onOpenPlan={(dateId) => {
          dismissResult();
          router.push(`/date/${dateId}`);
        }}
        onEdit={(item) => {
          dismissResult();
          openEdit(item);
        }}
        onLetsGo={() => {
          const id = Date.now();
          dismissResult();
          setBurst({ kind: 'hearts', id });
          celebratePlayer.seekTo(0).then(() => celebratePlayer.play());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
          setTimeout(() => {
            setBurst((current) => (current?.id === id ? null : current));
          }, 2600);
        }}
        onSpinAgain={() => {
          const id = Date.now();
          dismissResult();
          setBurst({ kind: 'skulls', id });
          failPlayer.seekTo(0).then(() => failPlayer.play());
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);
          setTimeout(() => {
            setBurst((current) => (current?.id === id ? null : current));
          }, 2600);
        }}
      />
      <IconBurst key={burst?.id ?? 'none'} kind={burst?.kind ?? null} />

      <Modal visible={editorOpen} animationType="slide" transparent onRequestClose={closeEditor}>
        <KeyboardAvoidingView style={styles.modalWrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.modalBackdrop} onPress={closeEditor} />
          <View style={[styles.sheet, { paddingBottom: 20 + keyboardInset }]}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets
              contentContainerStyle={styles.sheetContent}
            >
              <Text style={styles.sheetTitle}>{editingId ? 'Edit place' : 'Add a place'}</Text>
              <Text style={styles.sheetLead}>
                {editingId
                  ? 'Changes sync to both phones and stay on the wheel.'
                  : 'This stays on the wheel for both of you until you remove it.'}
              </Text>
              <Field label="Name" value={name} onChangeText={setName} placeholder="That pasta place we keep skipping" />
              <View style={styles.block}>
                <Text style={styles.label}>Location</Text>
                <PlaceSearch
                  onSelect={(picked) => {
                    setPlace(picked);
                    if (!name.trim()) setName(picked.name);
                  }}
                />
                {place ? (
                  <View style={styles.picked}>
                    <View style={styles.rowMeta}>
                      <Text style={styles.rowName}>{place.name}</Text>
                      <Text style={styles.rowSub}>{place.address}</Text>
                    </View>
                    <Pressable onPress={() => setPlace(null)}>
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ) : null}
                {place ? <PlaceMap place={place} height={160} /> : null}
              </View>
              <Field
                label="Details"
                value={details}
                onChangeText={setDetails}
                placeholder="Outdoor seats, go hungry, book ahead"
                multiline
              />
              <Button
                label={editingId ? 'Save changes' : 'Add to the wheel'}
                onPress={onSavePlace}
                loading={saving}
              />
              {editingId ? (
                <Button label="Remove from the wheel" variant="danger" onPress={() => onDeleteCustom(editingId)} />
              ) : null}
              <Button label="Cancel" variant="ghost" onPress={closeEditor} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, position: 'relative' },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  lead: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  error: { color: colors.danger },
  wheelBlock: { alignItems: 'center', paddingVertical: 12 },
  spinButton: {
    width: '100%',
    minHeight: 52,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  spinButtonDisabled: { opacity: 0.55 },
  spinButtonText: { color: colors.bg, fontSize: 16, fontWeight: '800' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  section: { color: colors.text, fontSize: 18, fontWeight: '800' },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { color: colors.accent, fontWeight: '800' },
  rowOff: { opacity: 0.55 },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowMeta: { flex: 1, gap: 3 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  rowName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  rowSub: { color: colors.textMuted, fontSize: 13 },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '92%',
  },
  sheetContent: {
    padding: 20,
    gap: 14,
  },
  sheetTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sheetLead: { color: colors.textMuted, lineHeight: 20, marginTop: -6 },
  block: { gap: 10 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  picked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
