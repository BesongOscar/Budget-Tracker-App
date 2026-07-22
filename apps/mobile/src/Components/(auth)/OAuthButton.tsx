import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

type OAuthButtonProps = {
  title: string;
  buttonWidth: number;
};

export default function OAuthButton({ title, buttonWidth }: OAuthButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 1,
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  buttonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "600",
  },
});
