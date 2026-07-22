import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Budget Detail: {id}</Text>
    </View>
  );
}
