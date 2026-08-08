import { View, Text, StyleSheet, Image } from "react-native";
import CTAbutton from "./CTAbutton";

const Placeholder = require("@/assets/images/Empty-bro (1).png");
type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Image source={Placeholder} style={styles.image} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <CTAbutton
          title={actionLabel}
          onPress={onAction}
          backgroundcolor="#007AFF"
          textColor="#FFFFFF"
          buttonIcon="add"
          buttonColor="#FFFFFF"
          marginVertical={16}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 16,
  },
  message: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  image: {
    width: 300,
    height: 400,
    marginBottom: 10,
  },
});
