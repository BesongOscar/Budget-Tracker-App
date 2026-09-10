import { useRef, useEffect } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";

function SkeletonBlock({ w, h, r = 8, style }: any) {
  return (
    <View
      style={[
        { width: w, height: h, borderRadius: r, backgroundColor: "#E5E5EA" },
        style,
      ]}
    />
  );
}

export default function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <SkeletonBlock w={180} h={22} style={{ marginBottom: 16 }} />
      <SkeletonBlock w="100%" h={120} style={{ marginBottom: 12 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.row}>
          <SkeletonBlock w={40} h={40} r={8} />
          <View style={{ flex: 1 }}>
            <SkeletonBlock w="80%" h={14} style={{ marginBottom: 6 }} />
            <SkeletonBlock w="50%" h={12} />
          </View>
          <SkeletonBlock w={60} h={14} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
});
