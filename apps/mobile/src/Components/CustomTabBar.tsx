import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const TAB_ICONS: Record<
  string,
  {
    focused: keyof typeof Ionicons.glyphMap;
    unfocused: keyof typeof Ionicons.glyphMap;
  }
> = {
  "(home)": { focused: "home", unfocused: "home-outline" },
  "(transactions)": {
    focused: "document-text",
    unfocused: "document-text-outline",
  },
  "(budgets)": { focused: "wallet", unfocused: "wallet-outline" },
  "(Profile)": { focused: "person", unfocused: "person-outline" },
};

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const routes = state.routes;
  const midpoint = Math.ceil(routes.length / 2);
  const leftRoutes = routes.slice(0, midpoint);
  const rightRoutes = routes.slice(midpoint);

  const renderTab = (route: any) => {
    const { options } = descriptors[route.key];
    const label = options.title || route.name;
    const isFocused = state.index === routes.indexOf(route);
    const icons = TAB_ICONS[route.name];
    const iconName = isFocused ? icons?.focused : icons?.unfocused;

    const onPress = () => {
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity key={route.key} onPress={onPress} style={styles.tab}>
        {iconName && (
          <Ionicons
            name={iconName}
            size={25}
            color={isFocused ? "#007AFF" : "#8E8E93"}
            style={styles.tabIcon}
          />
        )}
        <Text
          style={{ color: isFocused ? "#007AFF" : "#8E8E93", fontSize: 12 }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.sideTabs}>{leftRoutes.map(renderTab)}</View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-transaction")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.sideTabs}>{rightRoutes.map(renderTab)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 100,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
    alignItems: "center",
  },
  sideTabs: {
    flex: 1,
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    marginBottom: 4,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
