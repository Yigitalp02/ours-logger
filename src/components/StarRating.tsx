import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readonly?: boolean;
};

export function StarRating({ value, onChange, size = 28, readonly = false }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        const filled = value >= starValue;
        const half = !filled && value >= starValue - 0.5;
        const name = filled ? 'star' : half ? 'star-half' : 'star-outline';
        return (
          <View key={starValue} style={{ width: size, height: size }}>
            <Ionicons
              name={name}
              size={size}
              color={filled || half ? colors.star : colors.border}
            />
            {!readonly && (
              <>
                <Pressable
                  style={[styles.hit, { width: size / 2 }]}
                  onPress={() => onChange?.(starValue - 0.5)}
                />
                <Pressable
                  style={[styles.hit, { left: size / 2, width: size / 2 }]}
                  onPress={() => onChange?.(starValue)}
                />
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  hit: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
});
