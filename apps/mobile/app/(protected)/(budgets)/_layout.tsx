import { Stack } from 'expo-router';

export default function BudgetsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Budgets' }} />
      <Stack.Screen name="[id]" options={{ title: 'Budget Detail' }} />
    </Stack>
  );
}
