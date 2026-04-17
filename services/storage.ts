/**
 * Simple AsyncStorage-based persistence for auth data.
 * Swap to expo-secure-store if you need hardware-backed security.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthUser } from '@/types';

const AUTH_KEY = '@teachdesk/auth_user';

export async function saveAuthUser(user: AuthUser): Promise<void> {
  await AsyncStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export async function loadAuthUser(): Promise<AuthUser | null> {
  const raw = await AsyncStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export async function clearAuthUser(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_KEY);
}
