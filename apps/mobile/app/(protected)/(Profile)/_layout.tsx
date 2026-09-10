import { Stack, useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function SettingsButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => {
        router.push("/(Profile)/settings");
      }}
    >
      <Ionicons name="settings-outline" color="#000" size={25} />
    </TouchableOpacity>
  );
}

const renderHeaderRight = () => <SettingsButton />;

const indexOptions = {
  title: "Profile",
  headerTitleStyle: { fontSize: 25, fontWeight: "bold" as const },
  headerShadowVisible: false,
  headerRight: renderHeaderRight,
};

const screenOptions = { headerShown: true };

export default function ProfileLayout() {
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={indexOptions} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
      <Stack.Screen
        name="categories"
        options={{ title: "Categories", headerShown: false }}
      />
      <Stack.Screen name="insights" options={{ title: "Insights" }} />
      <Stack.Screen name="category/[id]" options={{ title: "Edit Category" }} />
    </Stack>
  );
}