import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CategoryChips } from '@/components/CategoryChips';
import { PhotoStrip } from '@/components/PhotoStrip';
import { PlaceMap } from '@/components/PlaceMap';
import { PlaceSearch } from '@/components/PlaceSearch';
import { StarRating } from '@/components/StarRating';
import { Button, Field } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { createId } from '@/lib/id';
import { formatWhen } from '@/lib/format';
import { useKeyboardBottomInset } from '@/lib/keyboard';
import { colors, radius } from '@/theme';
import { averageRating, datePlaces, dateRatings, type DatePhoto, type DatePlace, type Place } from '@/types';

type DraftPhoto = {
  id: string;
  uri: string;
  remote?: DatePhoto;
};

function tomorrow(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
}

export default function DateFormScreen() {
  const { id, status } = useLocalSearchParams<{ id?: string; status?: string }>();
  const { dates, currentProfile, addDate, saveDate } = useApp();
  const existing = dates.find((item) => item.id === id);
  const isPlan =
    existing?.status === 'planned' || (!existing && (Array.isArray(status) ? status[0] : status) === 'planned');

  const [title, setTitle] = useState(existing?.title ?? '');
  const [dateUnknown, setDateUnknown] = useState(Boolean(isPlan && !existing?.happenedAt));
  const [happenedAt, setHappenedAt] = useState(existing?.happenedAt ?? (isPlan ? tomorrow() : new Date()));
  const [showPicker, setShowPicker] = useState(false);
  const [categories, setCategories] = useState<string[]>(existing?.categories ?? []);
  const existingRatings = existing ? dateRatings(existing) : {};
  const [myRating, setMyRating] = useState(
    currentProfile ? (existingRatings[currentProfile.id] ?? 0) : (existing?.overallRating ?? 0),
  );
  const [places, setPlaces] = useState<DatePlace[]>(existing ? datePlaces(existing) : []);
  const [comment, setComment] = useState(
    existing?.comments.find((entry) => entry.profileId === currentProfile?.id)?.text ?? '',
  );
  const [cover, setCover] = useState<DraftPhoto | null>(
    existing?.cover ? { id: existing.cover.id, uri: existing.cover.url, remote: existing.cover } : null,
  );
  const [photos, setPhotos] = useState<DraftPhoto[]>(
    existing?.photos.map((photo) => ({ id: photo.id, uri: photo.url, remote: photo })) ?? [],
  );
  const [saving, setSaving] = useState(false);
  const keyboardInset = useKeyboardBottomInset();

  const myExistingComment = useMemo(
    () => existing?.comments.find((entry) => entry.profileId === currentProfile?.id),
    [existing, currentProfile],
  );

  function onDateChange(_event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) {
      setDateUnknown(false);
      setHappenedAt(date);
    }
  }

  async function pickFromLibrary(multiple: boolean) {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos needed', 'Allow photo access to attach pictures from the date.');
      return null;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: multiple,
      quality: 0.85,
    });
    if (result.canceled) return null;
    return result.assets;
  }

  async function pickCover() {
    const assets = await pickFromLibrary(false);
    if (!assets?.[0]) return;
    setCover({ id: createId(), uri: assets[0].uri });
  }

  async function addPhotos() {
    const assets = await pickFromLibrary(true);
    if (!assets?.length) return;
    setPhotos((current) => [
      ...current,
      ...assets.map((asset) => ({ id: createId(), uri: asset.uri })),
    ]);
  }

  async function onSave() {
    if (!title.trim()) {
      Alert.alert('Title missing', 'Give the date a name, like the restaurant or movie.');
      return;
    }
    try {
      setSaving(true);
      const kept = photos.filter((photo) => photo.remote).map((photo) => photo.remote!);
      const newPhotoUris = photos.filter((photo) => !photo.remote).map((photo) => photo.uri);
      const draft = {
        title,
        happenedAt: isPlan && dateUnknown ? null : happenedAt,
        status: isPlan ? 'planned' as const : 'logged' as const,
        categories,
        places,
        ratings: currentProfile ? { ...existingRatings, [currentProfile.id]: myRating } : existingRatings,
        overallRating: averageRating(
          currentProfile ? { ...existingRatings, [currentProfile.id]: myRating } : existingRatings,
        ),
        commentText: existing ? myExistingComment?.text : comment,
        cover: cover?.remote ?? null,
        newCoverUri: cover && !cover.remote ? cover.uri : null,
        photos: kept,
        newPhotoUris,
      };
      if (existing) {
        await saveDate(existing.id, draft);
      } else {
        await addDate(draft);
      }
      router.back();
    } catch (error) {
      Alert.alert('Could not save date', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: existing ? (isPlan ? 'Edit plan' : 'Edit date') : isPlan ? 'New plan' : 'New date' }} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 + keyboardInset }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.block}>
          <Text style={styles.label}>Main picture</Text>
          <Pressable style={styles.cover} onPress={pickCover}>
            {cover ? (
              <Image source={{ uri: cover.uri }} style={styles.coverImage} contentFit="cover" />
            ) : (
              <View style={styles.coverEmpty}>
                <Ionicons name="image-outline" size={32} color={colors.accent} />
                <Text style={styles.coverHint}>Add the main date picture</Text>
              </View>
            )}
          </Pressable>
          {cover ? (
            <Pressable onPress={() => setCover(null)}>
              <Text style={styles.removeCover}>Remove main picture</Text>
            </Pressable>
          ) : null}
        </View>

        <Field
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder={isPlan ? 'That new pasta place, Saturday' : 'Dinner at the garden place'}
        />

        <View style={styles.block}>
          <Text style={styles.label}>When</Text>
          {isPlan ? (
            <View style={styles.whenChoices}>
              <Pressable
                style={[styles.whenChip, dateUnknown && styles.whenChipOn]}
                onPress={() => {
                  setDateUnknown(true);
                  setShowPicker(false);
                }}
              >
                <Ionicons name="help-circle-outline" size={18} color={dateUnknown ? colors.rose : colors.textMuted} />
                <Text style={[styles.whenChipText, dateUnknown && styles.whenChipTextOn]}>{"I'm not sure yet"}</Text>
              </Pressable>
              <Pressable
                style={[styles.whenChip, !dateUnknown && styles.whenChipOn]}
                onPress={() => {
                  setDateUnknown(false);
                  setShowPicker(true);
                }}
              >
                <Ionicons name="calendar-outline" size={18} color={!dateUnknown ? colors.rose : colors.textMuted} />
                <Text style={[styles.whenChipText, !dateUnknown && styles.whenChipTextOn]}>
                  {dateUnknown ? 'Pick a day' : formatWhen(happenedAt)}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
              <Text style={styles.dateText}>{formatWhen(happenedAt)}</Text>
            </Pressable>
          )}
          {showPicker ? (
            <DateTimePicker value={happenedAt} mode="date" onChange={onDateChange} />
          ) : null}
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Categories</Text>
          <CategoryChips selected={categories} onChange={setCategories} />
        </View>

        {!isPlan ? (
          <View style={styles.block}>
            <Text style={styles.label}>
              {currentProfile?.name ? `${currentProfile.name}'s stars` : 'Your stars'}
            </Text>
            <Text style={styles.osm}>Only your rating. The other person sets theirs when they edit this date.</Text>
            <StarRating value={myRating} onChange={setMyRating} />
          </View>
        ) : null}

        <View style={styles.block}>
          <Text style={styles.label}>Places</Text>
          <Text style={styles.osm}>Search and tap a match to pin it. Add as many as you visited.</Text>
          <PlaceSearch
            onSelect={(place: Place) => {
              setPlaces((current) => [
                ...current,
                {
                  id: createId(),
                  name: place.name,
                  address: place.address,
                  lat: place.lat,
                  lng: place.lng,
                  rating: 0,
                },
              ]);
            }}
          />
          {places.map((item) => (
            <View key={item.id} style={styles.placeCard}>
              <View style={styles.placeHeader}>
                <View style={styles.placeMeta}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultAddress}>{item.address}</Text>
                </View>
                <Pressable onPress={() => setPlaces((current) => current.filter((place) => place.id !== item.id))}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>
              {!isPlan ? (
                <StarRating
                  value={item.rating}
                  onChange={(value) =>
                    setPlaces((current) =>
                      current.map((place) => (place.id === item.id ? { ...place, rating: value } : place)),
                    )
                  }
                  size={22}
                />
              ) : null}
              <PlaceMap place={item} height={180} />
            </View>
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.label}>Other photos</Text>
          <PhotoStrip
            photos={photos}
            onAdd={addPhotos}
            onRemove={(photoId) => setPhotos((current) => current.filter((photo) => photo.id !== photoId))}
          />
        </View>

        {!existing ? (
          <Field
            label="Your note"
            value={comment}
            onChangeText={setComment}
            placeholder={isPlan ? 'What do we want to try?' : 'What made this one stay with you?'}
            multiline
          />
        ) : null}

        <Button
          label={existing ? 'Save changes' : isPlan ? 'Save plan' : 'Log this date'}
          onPress={onSave}
          loading={saving}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 18, paddingBottom: 40 },
  block: { gap: 10 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cover: {
    height: 200,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  coverHint: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  removeCover: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  dateButton: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  dateText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  whenChoices: { gap: 8 },
  whenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  whenChipOn: {
    borderColor: colors.rose,
    backgroundColor: 'rgba(232, 90, 113, 0.12)',
  },
  whenChipText: { color: colors.textMuted, fontSize: 16, fontWeight: '600' },
  whenChipTextOn: { color: colors.text },
  resultName: { color: colors.text, fontWeight: '700' },
  resultAddress: { color: colors.textMuted, marginTop: 3, fontSize: 12 },
  osm: { color: colors.textDim, fontSize: 12, lineHeight: 18 },
  placeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  placeHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  placeMeta: { flex: 1, gap: 3 },
});
