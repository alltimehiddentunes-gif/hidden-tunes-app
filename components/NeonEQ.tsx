import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { COLORS } from "../constants/theme";

type NeonEQProps = {
  isPlaying?: boolean;
  size?: "small" | "medium" | "large";
};

export default function NeonEQ({
  isPlaying = false,
  size = "medium",
}: NeonEQProps) {
  const bars = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(0.3))
  ).current;

  useEffect(() => {
    if (!isPlaying) {
      bars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 0.25,
          duration: 250,
          useNativeDriver: false,
        }).start();
      });

      return;
    }

    const animations = bars.map((bar, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(bar, {
            toValue: index % 2 === 0 ? 1 : 0.65,
            duration: 250 + index * 80,
            useNativeDriver: false,
          }),
          Animated.timing(bar, {
            toValue: index % 2 === 0 ? 0.35 : 1,
            duration: 300 + index * 70,
            useNativeDriver: false,
          }),
        ])
      );
    });

    animations.forEach((animation) => animation.start());

    return () => {
      animations.forEach((animation) => animation.stop());
    };
  }, [isPlaying]);

  const maxHeight = size === "large" ? 42 : size === "small" ? 16 : 26;
  const barWidth = size === "large" ? 6 : size === "small" ? 3 : 4;
  const gap = size === "large" ? 5 : size === "small" ? 2 : 3;

  return (
    <View style={[styles.container, { height: maxHeight, gap }]}>
      {bars.map((bar, index) => {
        const height = bar.interpolate({
          inputRange: [0, 1],
          outputRange: [maxHeight * 0.25, maxHeight],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              {
                width: barWidth,
                height,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },

  bar: {
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primaryGlow,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
});