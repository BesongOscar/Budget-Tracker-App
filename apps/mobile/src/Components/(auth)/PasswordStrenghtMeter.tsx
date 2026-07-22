import { View, Text, StyleSheet } from 'react-native';

interface Props {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: 'transparent' };

  let types = 0;
  if (/[a-z]/.test(password)) types++;
  if (/[A-Z]/.test(password)) types++;
  if (/[0-9]/.test(password)) types++;
  if (/[^A-Za-z0-9]/.test(password)) types++;

  const score = password.length < 8 ? 0 : types;

  const map: Record<number, { label: string; color: string }> = {
    0: { label: 'Weak', color: '#FF3B30' },
    1: { label: 'Weak', color: '#FF3B30' },
    2: { label: 'Medium', color: '#FF9500' },
    3: { label: 'Strong', color: '#34C759' },
    4: { label: 'Very Strong', color: '#30B94C' },
  };

  return { score, ...map[score] };
}

export default function PasswordStrengthMeter({ password }: Props) {
  const { score, label, color } = getStrength(password);
  if (!label) return null;

  return (
    <View style={styles.container}>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${(score / 4) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  barBg: { height: 6, borderRadius: 3, backgroundColor: '#E5E5EA' },
  barFill: { height: 6, borderRadius: 3 },
  label: { fontSize: 12, marginTop: 2 },
});