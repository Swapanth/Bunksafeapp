import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";

import { Text } from "react-native";

export const IntroScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const bunkOpacity = useSharedValue(0);
  const bunkScale = useSharedValue(0.85);
  const safeOpacity = useSharedValue(0);
  const safeScale = useSharedValue(0.85);

  useEffect(() => {
    // Show BUNK first
    bunkOpacity.value = withTiming(1, { duration: 600 });
    bunkScale.value = withSpring(1);

    // Show SAFE after delay
    setTimeout(() => {
      safeOpacity.value = withTiming(1, { duration: 600 });
      safeScale.value = withSpring(1);
    }, 800);

    // Finish after 2.5s
    setTimeout(() => {
      runOnJS(onComplete)();
    }, 2500);
  }, []);

  const bunkStyle = useAnimatedStyle(() => ({
    opacity: bunkOpacity.value,
    transform: [{ scale: bunkScale.value }],
  }));

  const safeStyle = useAnimatedStyle(() => ({
    opacity: safeOpacity.value,
    transform: [{ scale: safeScale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.bunkText, bunkStyle]}>BUNK</Animated.Text>
      <Animated.Text style={[styles.safeText, safeStyle]}>SAFE</Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  bunkText: {
    fontSize: 96, // 👈 massive
    fontWeight: "900",
    color: "#22c55e", // green
    marginBottom: 24,
  },
  safeText: {
    fontSize: 96, // 👈 massive
    fontWeight: "900",
    color: "#111827", // black/dark gray
  },
});
