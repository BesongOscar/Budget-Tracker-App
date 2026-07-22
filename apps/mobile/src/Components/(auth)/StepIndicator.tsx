import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/src/constants/theme";

type StepIndicatorProps = {
  currentStep: number;
};

const steps = ["Account", "Verify", "Complete"];

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <View style={styles.container}>
      {steps.map((label, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;

        return (
          <React.Fragment key={index}>
            <View style={styles.stepWrapper}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.completedCircle,
                  isActive && styles.activeCircle,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.stepNumber,
                      (isCompleted || isActive) && styles.activeStepNumber,
                    ]}
                  >
                    {index + 1}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  isCompleted && styles.completedLabel,
                  isActive && styles.activeLabel,
                ]}
              >
                {label}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View style={styles.lineWrapper}>
                <View
                  style={[
                    styles.line,
                    index < currentStep && styles.completedLine,
                  ]}
                />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

export default StepIndicator;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  stepWrapper: {
    alignItems: "center",
    gap: 6,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  completedCircle: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  activeCircle: {
    borderColor: Colors.light.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  activeStepNumber: {
    color: Colors.light.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    textAlign: "center",
  },
  completedLabel: {
    color: Colors.light.primary,
  },
  activeLabel: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  lineWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 13,
    marginHorizontal: 4,
  },
  line: {
    height: 2,
    width: "100%",
    backgroundColor: "#D1D5DB",
  },
  completedLine: {
    backgroundColor: Colors.light.primary,
  },
});
