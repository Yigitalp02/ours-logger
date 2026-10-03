import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { openInGoogleMaps } from '@/lib/maps';
import { colors, radius } from '@/theme';
import type { Place } from '@/types';

type Marker = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type Props = {
  place?: Place | null;
  places?: Place[];
  height?: number;
};

function toMarkers(place?: Place | null, places?: Place[]): Marker[] {
  const source = places ?? (place ? [place] : []);
  return source
    .filter((item): item is Place & { lat: number; lng: number } => {
      return typeof item.lat === 'number' && typeof item.lng === 'number' && !Number.isNaN(item.lat);
    })
    .map((item) => ({
      name: item.name,
      address: item.address ?? '',
      lat: item.lat,
      lng: item.lng,
    }));
}

function buildHtml(markers: Marker[]): string {
  const center = markers[0];
  const payload = JSON.stringify(markers);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; background: #0C1115; }
    .leaflet-control-attribution { font-size: 10px; }
    .leaflet-popup-content { font-size: 13px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const markers = ${payload};
    const map = L.map('map', { zoomControl: true }).setView([${center.lat}, ${center.lng}], ${markers.length > 1 ? 11 : 15});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    const group = [];
    function openPlace(item) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'open-maps', place: item }));
      }
    }
    markers.forEach((item) => {
      const marker = L.marker([item.lat, item.lng]).addTo(map);
      marker.bindPopup(item.name + '<br><small>Open in Google Maps</small>');
      marker.on('click', function() { openPlace(item); });
      group.push(marker);
    });
    if (group.length > 1) {
      map.fitBounds(L.featureGroup(group).getBounds().pad(0.2));
    }
  </script>
</body>
</html>`;
}

export function PlaceMap({ place, places, height = 220 }: Props) {
  const markers = toMarkers(place, places);
  if (!markers.length) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No map pin for this place yet.</Text>
      </View>
    );
  }

  const mapKey = markers.map((item) => `${item.lat},${item.lng}`).join('|');
  const primary = markers[0];

  async function openMarker(marker: Marker) {
    try {
      await openInGoogleMaps(marker);
    } catch (error) {
      Alert.alert('Could not open Maps', error instanceof Error ? error.message : 'Try again.');
    }
  }

  function onMessage(event: WebViewMessageEvent) {
    try {
      const message = JSON.parse(event.nativeEvent.data) as { type?: string; place?: Marker };
      if (message.type === 'open-maps' && message.place) {
        openMarker(message.place);
      }
    } catch {
      return;
    }
  }

  return (
    <View style={styles.block}>
      <View style={[styles.wrap, { height }]}>
        <WebView
          key={mapKey}
          originWhitelist={['*']}
          source={{ html: buildHtml(markers) }}
          style={[styles.web, styles.webLayer]}
          scrollEnabled={false}
          javaScriptEnabled
          androidLayerType="hardware"
          onMessage={onMessage}
        />
      </View>
      <Pressable style={styles.openMaps} onPress={() => openMarker(primary)}>
        <Ionicons name="navigate-outline" size={16} color={colors.accent} />
        <Text style={styles.openMapsText}>
          {markers.length > 1 ? 'Open first pin in Google Maps' : 'Open in Google Maps'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 8,
  },
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  web: {
    flex: 1,
    backgroundColor: colors.bgElevated,
  },
  webLayer: {
    opacity: 0.99,
  },
  openMaps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  openMapsText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  empty: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    color: colors.textMuted,
  },
});
