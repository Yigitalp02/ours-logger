import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors, radius } from '@/theme';
import type { Place } from '@/types';

type Marker = {
  name: string;
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
  return source.filter((item): item is Place & { lat: number; lng: number } => {
    return typeof item.lat === 'number' && typeof item.lng === 'number' && !Number.isNaN(item.lat);
  }).map((item) => ({ name: item.name, lat: item.lat, lng: item.lng }));
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
    markers.forEach((item) => {
      const marker = L.marker([item.lat, item.lng]).addTo(map).bindPopup(item.name);
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

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        key={mapKey}
        originWhitelist={['*']}
        source={{ html: buildHtml(markers) }}
        style={styles.web}
        scrollEnabled={false}
        javaScriptEnabled
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
