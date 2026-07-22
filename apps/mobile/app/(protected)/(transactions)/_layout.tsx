import { Stack } from 'expo-router';

export default function TransactionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Transactions' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Transaction' }} />
    </Stack>
  );
}
