/**
 * components/ui/BottomNav.tsx
 *
 * Global bottom navigation bar — rendered on EVERY screen.
 * 5 tabs: Home · Attendance · Homework · Exam · Profile
 * Active tab highlighted with purple + filled background pill.
 * Uses router.replace() for tab roots, router.push() avoided
 * to keep the stack clean when switching sections.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, usePathname } from 'expo-router';
import { Colors, Shadow } from '@/constants/theme';

// ─── Tab definitions ──────────────────────────────────────
const TABS = [
  { key: 'home',       emoji: '🏠',  label: 'Home',       route: '/tabs'             },
  { key: 'attendance', emoji: '✅',  label: 'Attendance',  route: '/screens/attendance'     },
  { key: 'homework',   emoji: '📚',  label: 'Homework',    route: '/screens/homework-dashboard' },
//   { key: 'exam',       emoji: '📊',  label: 'Exam',        route: '/screens/exam'           },
  { key: 'profile',    emoji: '👤',  label: 'Profile',     route: '/tabs/profile'           },
] as const;

// ─── Which path belongs to which tab key ─────────────────
function resolveActiveTab(pathname: string): string {
  if (pathname === '/' || pathname.includes('/tabs/index') || pathname === '/tabs') return 'home';
  if (pathname.includes('/tabs/profile')) return 'profile';
  if (
    pathname.includes('/screens/attendance')
  ) return 'attendance';
  if (
    pathname.includes('/screens/homework') ||
    pathname.includes('/screens/add-homework')
  ) return 'homework';
  if (
    pathname.includes('/screens/exam') ||
    pathname.includes('/screens/marks') ||
    pathname.includes('/screens/coscholastic') ||
    pathname.includes('/screens/test-marks')
  ) return 'exam';
  return 'home';
}

export function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const activeTab = resolveActiveTab(pathname);

  return activeTab!="home"? (
    <View style={[styles.container, ]}>
      {TABS.map(tab => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => {
              if (isActive) return; // already here
              router.replace(tab.route as any);
            }}
            activeOpacity={0.75}
          >
            {/* Active pill background */}
            <View style={[styles.iconWrap, ]}>
              <Text style={styles.emoji}>{tab.emoji}</Text>
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  ):null;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    // ...Shadow.md,
    // Lift shadow upward
    // shadowOffset: { width: 0, height: -2 },
    // elevation: 12,
      height: 68,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: Colors.purpleBg,
  },
  emoji: { fontSize: 19 },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text3,
  },
  labelActive: {
    color: Colors.purple,
    fontWeight: '800',
  },
});