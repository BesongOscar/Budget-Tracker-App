import { Ionicons } from "@expo/vector-icons";
import React, { Key } from "react";
import { StyleSheet, TouchableOpacity, Text } from "react-native";

type CTAbuttonProps = {
  title: string;
  onPress: () => void;
  backgroundcolor?: string;
  textColor?: string;
  borderColor?: string;
  borderWidth?: number;
  marginVertical?: number;
  buttonIcon? : keyof typeof Ionicons.glyphMap;
  buttonColor?: string;
  disabled?: boolean;
};

const CTAbutton = ({
  title,
  onPress,
  backgroundcolor,
  textColor,
  borderColor,
  borderWidth,
  marginVertical,
  buttonIcon,
  buttonColor,
  disabled
}: CTAbuttonProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={disabled ? 1 : 0.7}
      style={[
        styles.button,
        {
          backgroundColor: backgroundcolor,
          borderColor: borderColor,
          borderWidth: borderWidth,
          marginVertical: marginVertical,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <Ionicons name={buttonIcon} size={25} color={buttonColor} style={{marginRight: 10}}/>
      <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default CTAbutton;

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "auto",
    flexDirection: "row",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
