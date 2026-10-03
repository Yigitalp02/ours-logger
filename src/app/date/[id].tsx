import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
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
  TextInput,
  View,
} from 'react-native';

import { Avatar } from '@/components/Avatar';
import { CategoryChips } from '@/components/CategoryChips';
import { PhotoViewer } from '@/components/PhotoViewer';
import { PlaceMap } from '@/components/PlaceMap';
import { StarRating } from '@/components/StarRating';
import { Button } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { formatRelativeTime, formatStars, formatWhen } from '@/lib/format';
import { useKeyboardBottomInset } from '@/lib/keyboard';
import { colors, radius } from '@/theme';
import { datePlaces, dateRatings } from '@/types';

export default function DateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dates, profiles, currentProfile, addDateComment, removeDateComment, changeDateStatus, removeDate } =
    useApp();
  const dateId = Array.isArray(id) ? id[0] : id;
  const item = dates.find((date) => date.id === dateId);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const keyboardInset = useKeyboardBottomInset();

  const planned = item?.status === 'planned';
  const places = item ? datePlaces(item) : [];
  const gallery = useMemo(() => {
    if (!item) return [];
    const extras = item.photos.map((photo) => photo.url);
    if (item.cover?.url && !extras.includes(item.cover.url)) {
      return [item.cover.url, ...extras];
    }
    return extras;
  }, [item]);
  const comments = useMemo(
    () =>
      [...(item?.comments ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [item],
  );

  if (!item) {
    return (
      <View style={styles.missing}>
        <Stack.Screen options={{ title: 'Date' }} />
        <Text style={styles.missingText}>This date is gone or still syncing.</Text>
      </View>
    );
  }

  async function onSaveComment() {
    if (!comment.trim() || !item) return;
    try {
      setSaving(true);
      await addDateComment(item, comment);
      setComment('');
    } catch (error) {
      Alert.alert('Could not post comment', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  }

  function onDeleteComment(commentId: string) {
    Alert.alert('Delete comment?', 'This will remove it on both phones.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (!item) return;
          removeDateComment(item, commentId);
        },
      },
    ]);
  }

  function onDelete() {
    Alert.alert(planned ? 'Delete this plan?' : 'Delete this date?', 'It will disappear on both phones.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!dateId) return;
          await removeDate(dateId);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: 40 + keyboardInset }]}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Stack.Screen options={{ title: item.title }} />
      {item.cover?.url ? (
        <Pressable onPress={() => setViewerIndex(Math.max(gallery.indexOf(item.cover!.url), 0))}>
          <Image source={{ uri: item.cover.url }} style={styles.hero} contentFit="cover" />
        </Pressable>
      ) : null}
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.when}>{formatWhen(item.happenedAt)}</Text>
      {item.status === 'planned' ? (
        <View style={styles.badge}>
          <Ionicons name="bookmark" size={14} color={colors.rose} />
          <Text style={styles.badgeText}>Planned</Text>
        </View>
      ) : (
        <View style={styles.peopleRatings}>
          {profiles.map((profile) => {
            const value = dateRatings(item)[profile.id] ?? 0;
            return (
              <View key={profile.id} style={styles.personRating}>
                <Text style={styles.personName}>{profile.name}</Text>
                {value > 0 ? (
                  <View style={styles.ratingRow}>
                    <StarRating value={value} readonly size={20} />
                    <Text style={styles.score}>{formatStars(value)}</Text>
                  </View>
                ) : (
                  <Text style={styles.scoreMuted}>No stars yet</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
      {item.categories.length ? <CategoryChips selected={item.categories} readonly /> : null}

      {places.length ? (
        <View style={styles.block}>
          <Text style={styles.section}>Places</Text>
          {places.length > 1 ? <PlaceMap places={places} height={220} /> : null}
          {places.map((place) => (
            <View key={place.id} style={styles.placeCard}>
              <Text style={styles.placeName}>{place.name}</Text>
              {place.address ? <Text style={styles.address}>{place.address}</Text> : null}
              {place.rating > 0 ? (
                <View style={styles.ratingRow}>
                  <StarRating value={place.rating} readonly size={16} />
                </View>
              ) : null}
              <PlaceMap place={place} height={180} />
            </View>
          ))}
        </View>
      ) : null}

      {item.photos.length ? (
        <View style={styles.block}>
          <Text style={styles.section}>Photos</Text>
          <View style={styles.grid}>
            {item.photos.map((photo) => (
              <Pressable
                key={photo.id}
                style={styles.gridItem}
                onPress={() => setViewerIndex(Math.max(gallery.indexOf(photo.url), 0))}
              >
                <Image source={{ uri: photo.url }} style={styles.gridImage} contentFit="cover" />
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.section}>{comments.length} Comments</Text>
        <View style={styles.composer}>
          <Avatar profile={currentProfile} size={36} />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textDim}
            style={styles.composerInput}
            multiline
          />
          <Pressable
            onPress={onSaveComment}
            disabled={saving || !comment.trim()}
            style={[styles.send, (!comment.trim() || saving) && styles.sendDisabled]}
          >
            <Ionicons name="send" size={16} color={comment.trim() ? colors.bg : colors.textDim} />
          </Pressable>
        </View>
        {comments.length ? (
          comments.map((entry) => {
            const author = profiles.find((profile) => profile.id === entry.profileId);
            const mine = entry.profileId === currentProfile?.id;
            return (
              <View key={entry.id} style={styles.comment}>
                <Avatar profile={author} size={36} />
                <View style={styles.commentBody}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentName}>{author?.name ?? 'Someone'}</Text>
                    <Text style={styles.commentTime}>{formatRelativeTime(entry.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentText}>{entry.text}</Text>
                  {mine ? (
                    <Pressable onPress={() => onDeleteComment(entry.id)}>
                      <Text style={styles.deleteComment}>Delete</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.address}>No comments yet. Be the first.</Text>
        )}
      </View>

      {item.status === 'planned' ? (
        <Button label="Mark as logged" onPress={async () => changeDateStatus(item.id, 'logged')} />
      ) : null}
      <Button
        label={item.status === 'planned' ? 'Edit plan' : 'Edit date'}
        variant="ghost"
        onPress={() => router.push({ pathname: '/date-form', params: { id: item.id } })}
      />
      <Button label={item.status === 'planned' ? 'Delete plan' : 'Delete date'} variant="danger" onPress={onDelete} />

      {viewerIndex != null ? (
        <PhotoViewer
          key={`${viewerIndex}-${gallery.length}`}
          uris={gallery}
          index={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 14, paddingBottom: 40 },
  hero: { width: '100%', height: 240, borderRadius: radius.lg, backgroundColor: colors.card },
  title: { color: colors.text, fontSize: 30, fontWeight: '800' },
  when: { color: colors.textMuted, fontSize: 15, marginTop: -6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { color: colors.rose, fontWeight: '800' },
  peopleRatings: { gap: 8 },
  personRating: { gap: 4 },
  personName: { color: colors.text, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  score: { color: colors.star, fontWeight: '800', fontSize: 16 },
  scoreMuted: { color: colors.textDim, fontSize: 14 },
  block: { gap: 10 },
  section: { color: colors.text, fontSize: 18, fontWeight: '800' },
  placeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  placeName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  address: { color: colors.textMuted, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  gridItem: { width: '31%', aspectRatio: 0.8 },
  gridImage: { width: '100%', height: '100%', borderRadius: radius.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    backgroundColor: colors.cardSoft,
  },
  comment: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  commentBody: { flex: 1, gap: 4 },
  commentTop: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  commentName: { color: colors.text, fontWeight: '700' },
  commentTime: { color: colors.textDim, fontSize: 12 },
  commentText: { color: colors.textMuted, lineHeight: 20 },
  deleteComment: { color: colors.textDim, fontWeight: '700', fontSize: 12, marginTop: 2 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 24 },
  missingText: { color: colors.textMuted },
});
