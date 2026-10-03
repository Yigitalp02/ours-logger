import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { colors } from '@/theme';

const STILL = require('../../assets/heart-frames/0.png');
const HEART = require('../../assets/pixel-heart.gif');
const LOOP_MS = 1530;
const LOOPS = 2;
const FADE_MS = 320;

type Props = {
  appReady: boolean;
  onFinished: () => void;
};

export function OpeningSplash({ appReady, onFinished }: Props) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [gifOn, setGifOn] = useState(false);
  const finished = useRef(false);
  const onFinishedRef = useRef(onFinished);
  const dismissed = useRef(false);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  function dismissNativeSplash() {
    if (dismissed.current) return;
    dismissed.current = true;
    SplashScreen.setOptions({ duration: 0, fade: false });
    void SplashScreen.hideAsync();
    setGifOn(true);
  }

  useEffect(() => {
    if (!gifOn || !appReady) return;

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished: done }) => {
        if (!done || finished.current) return;
        finished.current = true;
        onFinishedRef.current();
      });
    }, LOOP_MS * LOOPS);

    return () => clearTimeout(timer);
  }, [appReady, gifOn, opacity]);

  return (
    <Animated.View
      style={[styles.fill, { opacity }]}
      pointerEvents="auto"
      onLayout={dismissNativeSplash}
    >
      <Image
        source={gifOn ? HEART : STILL}
        placeholder={STILL}
        placeholderContentFit="contain"
        style={styles.heart}
        contentFit="contain"
        autoplay
        cachePolicy="memory"
        transition={0}
        accessibilityLabel="Ours"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  heart: { width: 200, height: 200 },
});
