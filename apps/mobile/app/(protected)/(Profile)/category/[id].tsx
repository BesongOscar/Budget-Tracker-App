import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Edit Category: {id}</Text>
    </View>
  );
}
