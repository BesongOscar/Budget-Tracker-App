import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function AddTransactionModal() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Add Transaction</Text>
      <TouchableOpacity onPress={() => router.back()}>
        <Text>Close</Text>
      </TouchableOpacity>
    </View>
  );
}