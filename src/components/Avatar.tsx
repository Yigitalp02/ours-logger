import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';
import type { Profile } from '@/types';

type Props = {
  profile?: Profile | null;
  name?: string;
  uri?: string | null;
  size?: number;
};

export function Avatar({ profile, name, uri, size = 56 }: Props) {
  const label = profile?.name || name || '?';
  const photo = profile?.photoUrl || uri;
  const initials = label
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      {photo ? (
        <Image source={{ uri: photo }} style={styles.image} contentFit="cover" />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.34 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    backgroundColor: colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: colors.text,
    fontWeight: '700',
  },
});
