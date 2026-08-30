import { Tabs } from "expo-router";
import CustomTabBar from "@/src/Components/CustomTabBar";

export default function ProtectedLayout() {
  return (
    <>
      <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Home",
            headerShadowVisible: false,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="(transactions)"
          options={{ title: "Transactions", headerShown: false }}
        />
        <Tabs.Screen
          name="(budgets)"
          options={{ title: "Budgets", headerShown: false }}
        />
        <Tabs.Screen name="(Profile)" options={{ title: "Profile" }} />
      </Tabs>
    </>
  );
}
