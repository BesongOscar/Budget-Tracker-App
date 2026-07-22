import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Edit Transaction: {id}</Text>
    </View>
  );
}
