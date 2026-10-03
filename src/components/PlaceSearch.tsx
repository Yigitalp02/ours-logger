import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { searchPlaces } from '@/services/places';
import { colors, radius } from '@/theme';
import type { Place } from '@/types';

type Props = {
  onSelect: (place: Place) => void;
};

export function PlaceSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const next = await searchPlaces(trimmed);
        setResults(next);
        setError(next.length ? null : 'No matching places. Try a more specific name.');
      } catch (searchError) {
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : 'Search failed.');
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(handle);
  }, [query]);

  return (
    <View style={styles.wrap}>
      <View style={styles.field}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search a restaurant, cafe, cinema..."
          placeholderTextColor={colors.textDim}
          style={styles.input}
          autoCorrect={false}
        />
        {loading ? <ActivityIndicator color={colors.accent} size="small" /> : null}
      </View>
      {error && !loading ? <Text style={styles.error}>{error}</Text> : null}
      {results.map((result) => (
        <Pressable
          key={`${result.lat}-${result.lng}-${result.name}`}
          style={styles.result}
          onPress={() => {
            onSelect(result);
            setQuery('');
            setResults([]);
            setError(null);
          }}
        >
          <Ionicons name="location-outline" size={18} color={colors.accent} />
          <View style={styles.resultMeta}>
            <Text style={styles.resultName}>{result.name}</Text>
            <Text style={styles.resultAddress}>{result.address}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 10,
  },
  error: {
    color: colors.textMuted,
    fontSize: 13,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultMeta: { flex: 1, gap: 3 },
  resultName: { color: colors.text, fontWeight: '700' },
  resultAddress: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
});
