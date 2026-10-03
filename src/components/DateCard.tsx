import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/StarRating';
import { useApp } from '@/context/AppContext';
import { formatStars, formatWhenShort } from '@/lib/format';
import { colors, radius } from '@/theme';
import { addedByLabel, coverUrl, datePlaces, dateRatings, isPlanned, type DateEntry, type Profile } from '@/types';

type Props = {
  item: DateEntry;
  onPress: () => void;
  compact?: boolean;
};

function PersonStars({ profile, value }: { profile: Profile; value: number }) {
  return (
    <View style={styles.personStars}>
      <Text style={styles.personName} numberOfLines={1}>
        {profile.name}
      </Text>
      {value > 0 ? (
        <View style={styles.stars}>
          <StarRating value={value} readonly size={13} />
          <Text style={styles.score}>{formatStars(value)}</Text>
        </View>
      ) : (
        <Text style={styles.scoreMuted}>No stars yet</Text>
      )}
    </View>
  );
}

export function DateCard({ item, onPress, compact = false }: Props) {
  const { profiles } = useApp();
  const cover = coverUrl(item);
  const planned = isPlanned(item);
  const ratings = dateRatings(item);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={[styles.poster, compact && styles.posterCompact]}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name={planned ? 'bookmark-outline' : 'image-outline'}
              size={22}
              color={colors.textDim}
            />
            <Text style={styles.placeholderText}>{planned ? 'Plan' : 'No still'}</Text>
          </View>
        )}
      </View>
      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.date}>{formatWhenShort(item.happenedAt)}</Text>
        {planned ? (
          <>
            <View style={styles.badge}>
              <Ionicons name="bookmark" size={12} color={colors.rose} />
              <Text style={styles.badgeText}>Planned</Text>
            </View>
            <Text style={styles.addedBy}>{addedByLabel(item.createdBy, profiles)}</Text>
          </>
        ) : (
          <View style={styles.ratings}>
            {profiles.map((profile) => (
              <PersonStars key={profile.id} profile={profile} value={ratings[profile.id] ?? 0} />
            ))}
          </View>
        )}
        {datePlaces(item).length ? (
          <Text style={styles.place} numberOfLines={1}>
            {datePlaces(item)
              .map((place) => place.name)
              .join(' · ')}
          </Text>
        ) : null}
        {item.categories.length ? (
          <Text style={styles.categories} numberOfLines={1}>
            {item.categories.join(' · ')}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  poster: {
    width: '46%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
  },
  posterCompact: {
    width: '40%',
    aspectRatio: 1,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    color: colors.textDim,
    fontSize: 12,
  },
  meta: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    gap: 4,
    justifyContent: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  date: {
    color: colors.textMuted,
    fontSize: 13,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  badgeText: {
    color: colors.rose,
    fontWeight: '700',
    fontSize: 13,
  },
  addedBy: {
    color: colors.textMuted,
    fontSize: 12,
  },
  ratings: {
    gap: 4,
    marginTop: 2,
  },
  personStars: {
    gap: 2,
  },
  personName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  score: {
    color: colors.star,
    fontWeight: '700',
    fontSize: 12,
  },
  scoreMuted: {
    color: colors.textDim,
    fontSize: 12,
  },
  place: {
    color: colors.text,
    fontSize: 13,
    marginTop: 2,
  },
  categories: {
    color: colors.textDim,
    fontSize: 12,
  },
});
