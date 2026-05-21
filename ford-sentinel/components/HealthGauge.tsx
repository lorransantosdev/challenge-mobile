import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../utils/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  value: number;
  size?: number;
  label?: string;
}

export default function HealthGauge({ value, size = 160, label = 'SAÚDE' }: Props) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);
  const [display, setDisplay] = React.useState(0);

  useEffect(() => {
    progress.value = withTiming(value, {
      duration: 1100,
      easing: Easing.out(Easing.cubic),
    });
  }, [value, progress]);

  useDerivedValue(() => {
    runOnJS(setDisplay)(Math.round(progress.value));
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const pct = Math.max(0, Math.min(100, progress.value)) / 100;
    return {
      strokeDashoffset: circumference * (1 - pct),
    };
  });

  const color =
    value >= 80 ? colors.cyan : value >= 60 ? colors.yellow : colors.red;

  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="1" />
            <Stop offset="1" stopColor={color} stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.4}
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.center}>
          <Text style={[styles.value, { color }]}>{display}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 44,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  label: {
    color: colors.text2,
    fontSize: 11,
    letterSpacing: 3,
    marginTop: 2,
  },
});
