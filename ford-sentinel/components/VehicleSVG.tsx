import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Rect, Circle, Line, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../utils/theme';

export interface Highlight {
  x: number;
  y: number;
  color: string;
  pulse?: boolean;
  label?: string;
}

interface Props {
  width?: number;
  height?: number;
  highlights?: Highlight[];
}

const VBOX_W = 360;
const VBOX_H = 180;

function PulseDot({ x, y, color }: { x: number; y: number; color: string }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(2.4, { duration: 1100, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1100, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 0 })
      ),
      -1,
      false
    );
  }, [scale, opacity]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 12,
        top: y - 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: color,
            position: 'absolute',
          },
          aStyle,
        ]}
      />
      <View
        style={{
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: 6,
        }}
      />
    </View>
  );
}

function StaticDot({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: x - 5,
        top: y - 5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        borderWidth: 1,
        borderColor: '#0F1628',
      }}
    />
  );
}

export default function VehicleSVG({ width = 340, height = 170, highlights = [] }: Props) {
  const gridLines = [];
  for (let i = 0; i <= VBOX_W; i += 30) {
    gridLines.push(
      <Line
        key={`v${i}`}
        x1={i}
        y1={0}
        x2={i}
        y2={VBOX_H}
        stroke={colors.border}
        strokeOpacity={0.25}
        strokeWidth={0.5}
      />
    );
  }
  for (let i = 0; i <= VBOX_H; i += 30) {
    gridLines.push(
      <Line
        key={`h${i}`}
        x1={0}
        y1={i}
        x2={VBOX_W}
        y2={i}
        stroke={colors.border}
        strokeOpacity={0.25}
        strokeWidth={0.5}
      />
    );
  }

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${VBOX_W} ${VBOX_H}`}>
        <Defs>
          <LinearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.cyan} stopOpacity="0.10" />
            <Stop offset="1" stopColor={colors.cyan} stopOpacity="0.02" />
          </LinearGradient>
        </Defs>

        <G>{gridLines}</G>

        {/* Pickup blueprint */}
        <G stroke={colors.cyan} strokeWidth={1.4} fill="url(#bodyGrad)" strokeLinejoin="round">
          {/* Cabin */}
          <Path d="M 110 70 L 130 50 L 200 50 L 215 70 Z" />
          {/* Bed */}
          <Rect x={215} y={70} width={95} height={45} rx={4} />
          {/* Hood / front */}
          <Path d="M 50 95 L 70 80 L 110 80 L 110 115 L 50 115 Z" />
          {/* Main body line */}
          <Path d="M 50 115 L 310 115 L 320 100 L 320 95 L 310 90 L 215 90 L 215 70 L 110 70 L 110 90 L 50 90 Z" />
          {/* Window cabin */}
          <Path d="M 135 67 L 148 55 L 197 55 L 207 67 Z" fill={colors.cyanGlow} />
          {/* Door line */}
          <Line x1={155} y1={70} x2={155} y2={115} />
          <Line x1={180} y1={70} x2={180} y2={115} />
          {/* Headlight */}
          <Rect x={52} y={92} width={10} height={8} rx={2} />
          {/* Taillight */}
          <Rect x={305} y={92} width={8} height={8} rx={2} />
          {/* Bumpers */}
          <Line x1={48} y1={115} x2={48} y2={125} />
          <Line x1={314} y1={115} x2={314} y2={125} />
          {/* Bed rail */}
          <Line x1={215} y1={70} x2={310} y2={70} strokeOpacity={0.5} />
        </G>

        {/* Wheels */}
        <G>
          <Circle cx={95} cy={130} r={18} stroke={colors.cyan} strokeWidth={1.6} fill={colors.bg} />
          <Circle cx={95} cy={130} r={9} stroke={colors.cyan} strokeWidth={1} fill="none" opacity={0.5} />
          <Circle cx={275} cy={130} r={18} stroke={colors.cyan} strokeWidth={1.6} fill={colors.bg} />
          <Circle cx={275} cy={130} r={9} stroke={colors.cyan} strokeWidth={1} fill="none" opacity={0.5} />
        </G>

        {/* Corner brackets (technical drawing aesthetic) */}
        <G stroke={colors.cyan} strokeWidth={1} strokeOpacity={0.45}>
          <Path d="M 8 8 L 24 8 M 8 8 L 8 24" fill="none" />
          <Path d="M 352 8 L 336 8 M 352 8 L 352 24" fill="none" />
          <Path d="M 8 172 L 24 172 M 8 172 L 8 156" fill="none" />
          <Path d="M 352 172 L 336 172 M 352 172 L 352 156" fill="none" />
        </G>
      </Svg>

      {highlights.map((h, i) => {
        const x = h.x * width;
        const y = h.y * height;
        return h.pulse ? (
          <PulseDot key={i} x={x} y={y} color={h.color} />
        ) : (
          <StaticDot key={i} x={x} y={y} color={h.color} />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
});
