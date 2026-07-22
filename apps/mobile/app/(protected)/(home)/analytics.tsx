import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function AnalyticsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Analytics</Text>
        <TouchableOpacity>
          <Text style={styles.period}>This Month ▾</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Spending Overview</Text>
        <Text style={styles.cardAmount}>$1,849.25</Text>
        <Text style={styles.cardChange}>↑ 8.2% vs last month</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Spending by Category</Text>
        <Text style={styles.placeholderHint}>Donut chart goes here</Text>
      </View>

      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Daily Spending</Text>
        <Text style={styles.placeholderHint}>Bar chart goes here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  backButton: {
    fontSize: 24,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  period: {
    fontSize: 14,
    color: '#007AFF',
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  cardLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cardAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
  },
  cardChange: {
    fontSize: 13,
    color: '#34C759',
    marginTop: 4,
  },
  placeholder: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  placeholderHint: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
});
