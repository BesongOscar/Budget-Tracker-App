import { Platform } from 'react-native';

const raw = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

function normalizeBaseUrl(url: string): string {
  if (
    __DEV__ &&
    Platform.OS === 'android' &&
    /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/i.test(url)
  ) {
    // Android emulator: localhost points at the emulator itself. Map the
    // host's loopback to the emulator's 10.0.2.2 alias so requests reach
    // the dev machine's API.
    return url.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)/i, '$110.0.2.2');
  }
  return url;
}

export const API_BASE_URL = normalizeBaseUrl(raw);