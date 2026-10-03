import { useEffect, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

const PALETTE = [colors.accent, colors.star, colors.rose, colors.white, '#3D8BFF', '#C9A227'];
const COUNT = 42;

type Piece = {
  left: number;
  color: string;
  size: number;
  drift: number;
  spin: number;
  delay: number;
  duration: number;
  anim: Animated.Value;
};

type Props = {
  play: boolean;
};

function createPieces(): Piece[] {
  const width = Dimensions.get('window').width;
  const pieces: Piece[] = [];
  for (let index = 0; index < COUNT; index += 1) {
    pieces.push({
      left: Math.random() * width,
      color: PALETTE[index % PALETTE.length],
      size: 6 + Math.random() * 7,
      drift: (Math.random() - 0.5) * 140,
      spin: 180 + Math.random() * 540,
      delay: Math.random() * 220,
      duration: 1600 + Math.random() * 900,
      anim: new Animated.Value(0),
    });
  }
  return pieces;
}

export function ConfettiBurst({ play }: Props) {
  const [pieces] = useState(createPieces);
  const height = Dimensions.get('window').height;

  useEffect(() => {
    if (!play) {
      pieces.forEach((piece) => piece.anim.setValue(0));
      return;
    }
    const runs = pieces.map((piece) =>
      Animated.timing(piece.anim, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        useNativeDriver: true,
      }),
    );
    Animated.stagger(12, runs).start();
  }, [pieces, play]);

  if (!play) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => (
        <Animated.View
          key={`${piece.left}-${index}`}
          style={[
            styles.piece,
            {
              left: piece.left,
              width: piece.size,
              height: piece.size * 1.4,
              backgroundColor: piece.color,
              transform: [
                {
                  translateY: piece.anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, height * 0.85],
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
                inputRange: [0, 0.75, 1],
                outputRange: [1, 1, 0],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
