import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { Card } from '@/components/ui';

const MENU_ITEMS = [
  { icon: '👤', label: 'Personal Information', sub: 'Name, contact, address' },
  { icon: '🔔', label: 'Notifications', sub: 'Alerts, reminders, SMS' },
  { icon: '🔒', label: 'Change Password', sub: 'Update your credentials' },
  { icon: '📋', label: 'My Classes', sub: 'View all assigned classes' },
  { icon: '📊', label: 'Performance Reports', sub: 'Class analytics & trends' },
  { icon: '❓', label: 'Help & Support', sub: 'FAQs, contact admin' },
  { icon: '📜', label: 'Privacy Policy', sub: 'Data usage & terms' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const record = user?.record;

  // Build initials from real name
  const initials = record?.name
    ? record.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'T';

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top }}>
      {/* Header */}
      <LinearGradient colors={[Colors.purple, Colors.purpleDeeper]} style={styles.header}>
        <View style={styles.decorCircle} />
        <Text style={styles.headerTitle}>Profile</Text>

        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{record?.name ?? 'Teacher'}</Text>
          <Text style={styles.role}>{record?.role ?? user?.role ?? 'Staff'}</Text>
          {record?.employee_id ? (
            <View style={styles.empBadge}>
              <Text style={styles.empId}>{record.employee_id}</Text>
            </View>
          ) : null}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>

        {/* Stats Row */}
        <View style={styles.infoRow}>
          {[
            { icon: '🏫', label: 'School', val: record?.school_id ? `ID ${record.school_id}` : '–' },
            { icon: '📚', label: 'Classes', val: '5' },
            { icon: '👩‍🎓', label: 'Students', val: '148' },
          ].map((item, i) => (
            <Card key={i} style={styles.infoCard}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={styles.infoVal}>{item.val}</Text>
              <Text style={styles.infoLabel}>{item.label}</Text>
            </Card>
          ))}
        </View>

        {/* Account Info */}
        <Card style={styles.accountCard}>
          <Text style={styles.sectionLabel}>Account Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>✉️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailKey}>Email</Text>
              <Text style={styles.detailVal}>{record?.email ?? '–'}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.detailBorder]}>
            <Text style={styles.detailIcon}>📱</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailKey}>Contact</Text>
              <Text style={styles.detailVal}>{record?.contact_no ?? '–'}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.detailBorder]}>
            <Text style={styles.detailIcon}>🎂</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailKey}>Date of Birth</Text>
              <Text style={styles.detailVal}>{record?.dob ?? '–'}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.detailBorder]}>
            <Text style={styles.detailIcon}>⚧️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailKey}>Gender</Text>
              <Text style={styles.detailVal}>{record?.gender ?? '–'}</Text>
            </View>
          </View>

          <View style={[styles.detailRow, styles.detailBorder]}>
            <Text style={styles.detailIcon}>🏷️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailKey}>Role</Text>
              <Text style={styles.detailVal}>{record?.role ?? user?.role ?? '–'}</Text>
            </View>
          </View>
        </Card>

        {/* Menu */}
        <Card style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuRow, i < MENU_ITEMS.length - 1 && styles.menuBorder]}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconWrap}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuSub}>{item.sub}</Text>
              </View>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </Card>

        {/* Auth token info (dev helper) */}
        {user?.token ? (
          <View style={styles.tokenCard}>
            <Text style={styles.tokenLabel}>Session Token (truncated)</Text>
            <Text style={styles.tokenVal} numberOfLines={1}>{user.token.slice(0, 20)}…</Text>
          </View>
        ) : null}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Text style={styles.logoutText}>🚪  Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>TeachDesk v1.0.0 · Expo SDK 54 · EduMug API</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl, paddingTop: 16, paddingBottom: 28,
    position: 'relative', overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute', top: -50, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white, marginBottom: 16 },
  avatarWrap: { alignItems: 'center' },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: Colors.white },
  name: { fontSize: 20, fontWeight: '800', color: Colors.white },
  role: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  empBadge: {
    marginTop: 8, backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  empId: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  infoRow: { flexDirection: 'row', gap: 10, marginHorizontal: Spacing.lg, marginTop: 16, marginBottom: 10 },
  infoCard: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8 },
  infoIcon: { fontSize: 20, marginBottom: 6 },
  infoVal: { fontSize: 18, fontWeight: '800', color: Colors.text1 },
  infoLabel: { fontSize: 10, color: Colors.text3, fontWeight: '600', marginTop: 2 },
  accountCard: { marginHorizontal: Spacing.lg, marginBottom: 10, padding: Spacing.lg },
  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.text3,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  detailBorder: { borderTopWidth: 1, borderTopColor: Colors.surface },
  detailIcon: { fontSize: 16, marginTop: 1 },
  detailKey: { fontSize: 10, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal: { fontSize: 13, fontWeight: '600', color: Colors.text1, marginTop: 2 },
  menuCard: { marginHorizontal: Spacing.lg, marginBottom: 12, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: Spacing.lg, gap: 12 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  menuIcon: { fontSize: 16 },
  menuLabel: { fontSize: 13, fontWeight: '600', color: Colors.text1 },
  menuSub: { fontSize: 11, color: Colors.text3, marginTop: 1 },
  menuChevron: { fontSize: 20, color: Colors.text3 },
  tokenCard: {
    marginHorizontal: Spacing.lg, marginBottom: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  tokenLabel: { fontSize: 10, color: Colors.text3, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  tokenVal: { fontSize: 11, color: Colors.text2, fontFamily: 'monospace' },
  logoutBtn: {
    marginHorizontal: Spacing.lg, marginBottom: 12,
    backgroundColor: Colors.redBg, borderRadius: Radius.lg,
    padding: 15, alignItems: 'center',
    borderWidth: 1, borderColor: '#fcc',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: Colors.redText },
  version: { textAlign: 'center', fontSize: 11, color: Colors.text3, marginBottom: 10 },
});
