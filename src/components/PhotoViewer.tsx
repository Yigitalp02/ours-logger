import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors } from '@/theme';

type Props = {
  uris: string[];
  index: number;
  onClose: () => void;
};

export function PhotoViewer({ uris, index, onClose }: Props) {
  const { width, height } = useWindowDimensions();
  const start = Math.min(Math.max(index, 0), Math.max(uris.length - 1, 0));
  const [current, setCurrent] = useState(start);

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    if (next >= 0 && next < uris.length) setCurrent(next);
  }

  return (
    <Modal visible={uris.length > 0} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <FlatList
          key={`${start}-${uris.length}`}
          data={uris}
          horizontal
          pagingEnabled
          initialScrollIndex={start}
          getItemLayout={(_, itemIndex) => ({ length: width, offset: width * itemIndex, index: itemIndex })}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(uri, itemIndex) => `${uri}-${itemIndex}`}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={({ item }) => (
            <View style={[styles.page, { width, height }]}>
              <Image source={{ uri: item }} style={[styles.image, { width, height: height * 0.8 }]} contentFit="contain" />
            </View>
          )}
        />
        <Pressable style={styles.close} onPress={onClose} hitSlop={12} accessibilityLabel="Close photo">
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        {uris.length > 1 ? (
          <View style={styles.countWrap} pointerEvents="none">
            <Text style={styles.count}>
              {current + 1} / {uris.length}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    backgroundColor: 'transparent',
  },
  close: {
    position: 'absolute',
    top: 48,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countWrap: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  count: {
    color: colors.text,
    fontWeight: '700',
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
