import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";
import React, { useEffect, useCallback, useState } from "react";
import { Colors } from "@/src/constants/theme";
import CTAbutton from "@/src/Components/CTAbutton";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SLIDE_DURATION = 4000;
const ONBOARDING_KEY = "onboarding_complete";

const slides = [
  {
    image: require("../../assets/images/slide1.png"),
    title: "Track Everything 📊",
    subtitle:
      "Monitor your income and expenses in one place to gain better control of your finances",
  },
  {
    image: require("../../assets/images/slide2.png"),
    title: "Set Budgets 🎯",
    subtitle: "Create monthly budgets to stay on top of your spending habits",
  },
  {
    image: require("../../assets/images/slide3.png"),
    title: "Get Alerts 🔔",
    subtitle:
      "Receive notifications when you approach your limits or overspend",
  },
];

function Segment({
  index,
  activeIndex,
  progress,
}: {
  index: number;
  activeIndex: number;
  progress: SharedValue<number>;
}) {
  const isCompleted = index < activeIndex;
  const isActive = index === activeIndex;

  const barStyle = useAnimatedStyle((): any => {
    if (isCompleted) {
      return { width: "100%" };
    }
    if (isActive) {
      const w = `${progress.value * 100}%`;
      return { width: w };
    }
    return { width: "0%" };
  });

  return (
    <View style={styles.segmentTrack}>
      <Animated.View
        style={[
          styles.segmentFill as any,
          barStyle,
          {
            backgroundColor:
              isCompleted || isActive ? Colors.light.primary : "transparent",
          },
        ]}
      />
    </View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const goToNext = useCallback(() => {
    setActiveIndex((prev) => {
      if (prev < slides.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, []);

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/(auth)/register");
  };

  useEffect(() => {
    progress.value = 0;

    if (activeIndex === slides.length - 0) return;

    progress.value = withTiming(
      1,
      {
        duration: SLIDE_DURATION,
        easing: Easing.linear,
      },
      (finished) => {
        if (finished) {
          runOnJS(goToNext)();
        }
      },
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [activeIndex, progress, goToNext]);

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      cancelAnimation(progress);
      setActiveIndex((prev) => prev + 1);
    } else {
      finish();
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      cancelAnimation(progress);
      setActiveIndex((prev) => prev - 1);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity onPress={handleBack} style={styles.backbutton}>
        <Ionicons name="chevron-back" color={"#007AFF"} size={25} />
      </TouchableOpacity>

      <View style={styles.slideContainer}>
        <Image
          source={slides[activeIndex].image}
          style={styles.slideImage}
          resizeMode="cover"
        />
        <Text style={styles.title}>{slides[activeIndex].title}</Text>
        <Text style={styles.subtitle}>{slides[activeIndex].subtitle}</Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.paginationRow}>
          {slides.map((_, i) => (
            <Segment
              key={i}
              index={i}
              activeIndex={activeIndex}
              progress={progress}
            />
          ))}
        </View>

        <CTAbutton
          title={activeIndex === slides.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          backgroundcolor={"#007AFF"}
          textColor={"#ffffff"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  backbutton: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#007AFF",
    borderWidth: 1,
    marginLeft: 10,
    borderRadius: "50%",
  },
  slideContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  slideImage: {
    width: 300,
    height: 450,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: Colors.light.text,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: "center",
    lineHeight: 23,
  },
  bottomSection: {
    paddingHorizontal: 10,
    paddingBottom: 60,
  },
  paginationRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 30,
  },
  segmentTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
    overflow: "hidden",
  },
  segmentFill: {
    height: "100%",
    borderRadius: 2,
  },
});
