import { Tabs } from "expo-router";
import CustomTabBar from "@/src/Components/CustomTabBar";

export default function ProtectedLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="(home)" options={{ title: 'Home' }} />
      <Tabs.Screen name="(transactions)" options={{ title: 'Transactions' }} />
      <Tabs.Screen name="(budgets)" options={{ title: 'Budgets' }} />
      <Tabs.Screen name="(Profile)" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
