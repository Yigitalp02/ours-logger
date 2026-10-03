import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '@/theme';
import { DATE_CATEGORIES } from '@/types';

type Props = {
  selected: string[];
  onChange?: (next: string[]) => void;
  readonly?: boolean;
};

export function CategoryChips({ selected, onChange, readonly = false }: Props) {
  return (
    <View style={styles.wrap}>
      {(readonly ? selected : DATE_CATEGORIES).map((category) => {
        const active = selected.includes(category);
        return (
          <Pressable
            key={category}
            disabled={readonly}
            onPress={() => {
              if (!onChange) return;
              onChange(
                active ? selected.filter((item) => item !== category) : [...selected, category],
              );
            }}
            style={[styles.chip, active && styles.active]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{category}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.bgElevated,
  },
  active: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  activeLabel: {
    color: colors.accent,
  },
});
