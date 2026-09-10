import { Alert } from "react-native";

export function confirmDelete(opts: {
  title: string;
  message: string;
  onConfirm: () => void;
}) {
  Alert.alert(opts.title, opts.message, [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: opts.onConfirm },
  ]);
}
