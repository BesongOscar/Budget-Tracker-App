import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";``

type ContentBoxProps = {
  title: string;
  backgroundColor: string;
  width: number;
  amount?: number;
  textColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export default function ContentBox({
  title,
  backgroundColor,
  width,
  amount,
  textColor,
  icon,
}: ContentBoxProps) {
  return (
    <View style={[styles.contentBox, { backgroundColor, width }]}>
        {/* Title and Icon */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 }}>
        <Text style={[styles.contentText, { color: textColor }]}>{title}</Text>
        <Ionicons name={icon} size={24} color={textColor} />
      </View>
        {/* Amount */}
      {amount !== undefined && (
        <Text style={[styles.contentText, { color: textColor }]}>${amount.toFixed(2)}</Text>
      )}
      {/* Additional Content */}
      <View style={{ alignItems: "flex-start"}}>
        <Text style={[styles.contentText, { color: textColor }]}>Additional content goes here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentBox: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    paddingHorizontal: 15,
    paddingVertical: 5
  },
  contentText: {
    fontSize: 16,
    padding: 16,
  },
});
