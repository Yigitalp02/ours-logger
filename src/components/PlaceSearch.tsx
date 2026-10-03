import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

  const trimmed = query.trim();
  const searching = trimmed.length >= 2;

  useEffect(() => {
    if (!searching) return;

    let cancelled = false;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const next = await searchPlaces(trimmed);
        if (cancelled) return;
        setResults(next);
        setError(next.length ? null : 'No matching places. Try a more specific name.');
      } catch (searchError) {
        if (cancelled) return;
        setResults([]);
        setError(searchError instanceof Error ? searchError.message : 'Search failed.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searching, trimmed]);

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
        {searching && loading ? <ActivityIndicator color={colors.accent} size="small" /> : null}
      </View>
      {searching && error && !loading ? <Text style={styles.error}>{error}</Text> : null}
      {searching && results.length ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={styles.results}
          contentContainerStyle={styles.resultsInner}
        >
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
        </ScrollView>
      ) : null}
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
  results: {
    maxHeight: 220,
  },
  resultsInner: {
    gap: 8,
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
