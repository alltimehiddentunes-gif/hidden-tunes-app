import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import type { ViewStyle } from "react-native";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  SharedValue,
} from "react-native-reanimated";

import { COLORS } from "../constants/theme";

type LiveWaveformProps = {
  isPlaying?: boolean;
  size?: "small" | "medium" | "large";
  color?: string;
};

type WaveBarProps = {
  index: number;
  progress: SharedValue<number>;
  isPlaying: boolean;
  color: string;
  barHeight: number;
  barWidth: number;
};

const BAR_COUNT = 24;

export default function LiveWaveform({
  isPlaying = false,
  size = "medium",
  color = COLORS.primary,
}: LiveWaveformProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isPlaying) {
      progress.value = withRepeat(
        withTiming(1, { duration: 900 }),
        -1,
        true
      );
    } else {
      progress.value = withTiming(0, { duration: 300 });
    }
  }, [isPlaying]);

  const barHeight = size === "small" ? 26 : size === "large" ? 86 : 52;
  const barWidth = size === "small" ? 3 : size === "large" ? 6 : 4;

  return (
    <View style={[styles.container, { height: barHeight }]}>
      {Array.from({ length: BAR_COUNT }).map((_, index) => (
        <WaveBar
          key={index}
          index={index}
          progress={progress}
          isPlaying={isPlaying}
          color={color}
          barHeight={barHeight}
          barWidth={barWidth}
        />
      ))}
    </View>
  );
}

function WaveBar({
  index,
  progress,
  isPlaying,
  color,
  barHeight,
  barWidth,
}: WaveBarProps) {
  const waveOffset = (index % 7) / 7;
  const randomPeak = 0.2 + ((index * 13) % 10) / 20;

  const animatedStyle = useAnimatedStyle<ViewStyle>(() => {
    const animatedHeight = interpolate(progress.value, [0, 0.5, 1], [
      barHeight * 0.18,
      barHeight * (0.35 + waveOffset),
      barHeight * randomPeak,
    ]);

    return {
      height: isPlaying ? animatedHeight : barHeight * 0.18,
      opacity: isPlaying ? 1 : 0.35,
      transform: [{ scaleY: isPlaying ? 1 : 0.65 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.bar,
        animatedStyle,
        {
          width: barWidth,
          backgroundColor: color,
          borderRadius: barWidth,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    overflow: "hidden",
  },

  bar: {
    minHeight: 5,
  },
});