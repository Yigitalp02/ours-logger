import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

const COUNT = 28;

type Kind = 'hearts' | 'skulls';

type Piece = {
  left: number;
  size: number;
  drift: number;
  spin: number;
  delay: number;
  duration: number;
  color: string;
  anim: Animated.Value;
};

type Props = {
  kind: Kind | null;
};

function createPieces(kind: Kind): Piece[] {
  const width = Dimensions.get('window').width;
  const palette = kind === 'hearts' ? [colors.rose, '#FF4D8D', '#FF8FAB', colors.danger] : [colors.text, colors.textMuted, '#C5CDD3', colors.white];
  const pieces: Piece[] = [];
  for (let index = 0; index < COUNT; index += 1) {
    pieces.push({
      left: Math.random() * width,
      size: 18 + Math.random() * 16,
      drift: (Math.random() - 0.5) * 180,
      spin: 120 + Math.random() * 400,
      delay: Math.random() * 180,
      duration: 1400 + Math.random() * 800,
      color: palette[index % palette.length],
      anim: new Animated.Value(0),
    });
  }
  return pieces;
}

export function IconBurst({ kind }: Props) {
  const [pieces] = useState(() => (kind ? createPieces(kind) : []));
  const height = Dimensions.get('window').height;

  useEffect(() => {
    if (!kind || !pieces.length) return;
    pieces.forEach((piece) => piece.anim.setValue(0));
    const runs = pieces.map((piece) =>
      Animated.timing(piece.anim, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(10, runs).start();
  }, [kind, pieces]);

  if (!kind) return null;

  const icon = kind === 'hearts' ? 'heart' : 'skull';

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => (
        <Animated.View
          key={`${kind}-${index}`}
          style={[
            styles.piece,
            {
              left: piece.left,
              transform: [
                {
                  translateY: piece.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, height * 0.9],
                  }),
                },
                {
                  translateX: piece.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, piece.drift],
                  }),
                },
                {
                  rotate: piece.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', `${piece.spin}deg`],
                  }),
                },
              ],
              opacity: piece.anim.interpolate({
                inputRange: [0, 0.7, 1],
                outputRange: [1, 1, 0],
              }),
            },
          ]}
        >
          <Ionicons name={icon} size={piece.size} color={piece.color} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
  },
});
