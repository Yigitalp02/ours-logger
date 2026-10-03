import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme';

type Photo = {
  id: string;
  uri: string;
};

type Props = {
  photos: Photo[];
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  onOpen?: (uri: string) => void;
};

export function PhotoStrip({ photos, onAdd, onRemove, onOpen }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {photos.map((photo) => (
        <View key={photo.id} style={styles.thumbWrap}>
          <Pressable onPress={() => onOpen?.(photo.uri)}>
            <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
          </Pressable>
          {onRemove ? (
            <Pressable style={styles.remove} onPress={() => onRemove(photo.id)}>
              <Ionicons name="close" size={14} color={colors.white} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {onAdd ? (
        <Pressable style={styles.add} onPress={onAdd}>
          <Ionicons name="image-outline" size={26} color={colors.accent} />
          <Text style={styles.addLabel}>Photo</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingRight: 8,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 92,
    height: 116,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 92,
    height: 116,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
