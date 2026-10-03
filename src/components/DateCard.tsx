import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StarRating } from '@/components/StarRating';
import { formatShortDate, formatStars } from '@/lib/format';
import { colors, radius } from '@/theme';
import { coverUrl, datePlaces, isPlanned, type DateEntry } from '@/types';

type Props = {
  item: DateEntry;
  onPress: () => void;
};

export function DateCard({ item, onPress }: Props) {
  const cover = coverUrl(item);
  const planned = isPlanned(item);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.poster}>
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
        <Text style={styles.date}>{formatShortDate(item.happenedAt)}</Text>
        {planned ? (
          <View style={styles.badge}>
            <Ionicons name="bookmark" size={12} color={colors.rose} />
            <Text style={styles.badgeText}>Planned</Text>
          </View>
        ) : (
          <View style={styles.stars}>
            <StarRating value={item.overallRating} readonly size={16} />
            <Text style={styles.score}>{formatStars(item.overallRating)}</Text>
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
    width: 92,
    height: 124,
    backgroundColor: colors.bgElevated,
  },
  image: {
    width: '100%',
    height: '100%',
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
    padding: 12,
    gap: 4,
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
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  score: {
    color: colors.star,
    fontWeight: '700',
    fontSize: 13,
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
