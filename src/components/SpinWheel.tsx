import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';

import { colors } from '@/theme';

const SLICE_COLORS = [
  '#E11D48',
  '#2563EB',
  '#EC4899',
  '#CA8A04',
  '#7C3AED',
  '#EA580C',
  '#0891B2',
  '#16A34A',
  '#DB2777',
  '#4F46E5',
  '#F59E0B',
  '#0EA5E9',
];

type Option = {
  key: string;
  name: string;
};

type Props = {
  options: Option[];
  size?: number;
};

export type SpinWheelHandle = {
  spin: () => Promise<number>;
};

function slicePath(index: number, count: number, radius: number): string {
  if (count === 1) {
    return `M ${radius} ${radius} m ${-radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 ${-radius * 2},0`;
  }
  const start = (index / count) * Math.PI * 2 - Math.PI / 2;
  const end = ((index + 1) / count) * Math.PI * 2 - Math.PI / 2;
  const x1 = radius + radius * Math.cos(start);
  const y1 = radius + radius * Math.sin(start);
  const x2 = radius + radius * Math.cos(end);
  const y2 = radius + radius * Math.sin(end);
  return `M ${radius} ${radius} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;
}

function labelFor(name: string, count: number): string {
  const max = count > 8 ? 8 : count > 5 ? 11 : 14;
  return name.length > max ? `${name.slice(0, max - 1)}...` : name;
}

export const SpinWheel = forwardRef<SpinWheelHandle, Props>(function SpinWheel({ options, size = 300 }, ref) {
  const rotation = useRef(new Animated.Value(0)).current;
  const currentDeg = useRef(0);
  const spinning = useRef(false);

  const slices = useMemo(() => {
    const count = Math.max(options.length, 1);
    return options.length
      ? options.map((option, index) => ({
          ...option,
          color: SLICE_COLORS[index % SLICE_COLORS.length],
          path: slicePath(index, count, size / 2),
        }))
      : [
          {
            key: 'empty',
            name: 'Add a place',
            color: colors.card,
            path: slicePath(0, 1, size / 2),
          },
        ];
  }, [options, size]);

  useImperativeHandle(
    ref,
    () => ({
      spin: () =>
        new Promise((resolve, reject) => {
          if (options.length === 0) {
            reject(new Error('Wheel is not ready'));
            return;
          }
          if (spinning.current) {
            rotation.stopAnimation((value) => {
              currentDeg.current = typeof value === 'number' ? value : currentDeg.current;
            });
          }
          spinning.current = true;
          const count = options.length;
          const slice = 360 / count;
          const winner = Math.floor(Math.random() * count);
          const targetMod = (360 - (winner * slice + slice / 2)) % 360;
          const currentMod = ((currentDeg.current % 360) + 360) % 360;
          const extraTurns = 5 + Math.floor(Math.random() * 3);
          const delta = (targetMod - currentMod + 360) % 360;
          const next = currentDeg.current + extraTurns * 360 + delta;

          Animated.timing(rotation, {
            toValue: next,
            duration: 4200,
            easing: Easing.bezier(0.12, 0.65, 0.15, 1),
            useNativeDriver: true,
          }).start(({ finished }) => {
            spinning.current = false;
            if (!finished) {
              reject(new Error('Spin cancelled'));
              return;
            }
            currentDeg.current = next;
            resolve(winner);
          });
        }),
    }),
    [options.length, rotation],
  );

  const rotate = rotation.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  const radius = size / 2;
  const showLabels = options.length > 0 && options.length <= 12;

  return (
    <View style={[styles.wrap, { width: size, height: size }]} pointerEvents="box-none">
      <View style={styles.pointer} pointerEvents="none">
        <View style={styles.pointerTip} />
      </View>
      <Animated.View style={{ transform: [{ rotate }] }} pointerEvents="none">
        <Svg width={size} height={size} pointerEvents="none">
          {slices.map((slice, index) => {
            const count = slices.length;
            const mid = ((index + 0.5) / count) * 360 - 90;
            const labelR = radius * 0.58;
            const lx = radius + labelR * Math.cos((mid * Math.PI) / 180);
            const ly = radius + labelR * Math.sin((mid * Math.PI) / 180);
            return (
              <G key={slice.key}>
                <Path d={slice.path} fill={slice.color} stroke={colors.bg} strokeWidth={2} />
                {showLabels ? (
                  <SvgText
                    x={lx}
                    y={ly}
                    fill={colors.white}
                    fontSize={count > 8 ? 9 : 11}
                    fontWeight="700"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    transform={`rotate(${mid + 90}, ${lx}, ${ly})`}
                  >
                    {labelFor(slice.name, count)}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
          <Circle cx={radius} cy={radius} r={28} fill={colors.bg} stroke={colors.border} strokeWidth={3} />
        </Svg>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointer: {
    position: 'absolute',
    top: -8,
    zIndex: 2,
    alignItems: 'center',
  },
  pointerTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 22,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.text,
  },
});
