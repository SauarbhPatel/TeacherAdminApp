import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { CLASSES, NAMES } from '@/constants/data';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

export default function AttendanceConfirmScreen() {
  const insets = useSafeAreaInsets();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const id = classId || '5A';
  const { attendance } = useAppContext();
  const cls = CLASSES[id];
  const att = attendance[id] || {};
  const names = NAMES[id] || [];

  const { p, a, l, absentees } = useMemo(() => {
    let p = 0, a = 0, l = 0;
    const absentees: string[] = [];
    names.forEach((name, i) => {
      const v = att[i + 1];
      if (v === 'P') p++;
      else if (v === 'A') { a++; absentees.push(name); }
      else if (v === 'L') l++;
    });
    return { p, a, l, absentees };
  }, [att, names]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Green Header */}
      <LinearGradient
        colors={[Colors.green, '#0a8a50']}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
        <View style={styles.checkCircle}>
          <Text style={styles.checkMark}>✓</Text>
        </View>
        <Text style={styles.title}>Attendance Saved!</Text>
        <Text style={styles.sub}>{cls?.name} · Apr 2</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { num: p, label: 'Present', bg: Colors.greenBg, color: Colors.green, textColor: Colors.greenText },
            { num: a, label: 'Absent', bg: Colors.redBg, color: Colors.red, textColor: Colors.redText },
            { num: l, label: 'Late', bg: Colors.amberBg, color: Colors.amber, textColor: Colors.amberText },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
              <Text style={[styles.statLabel, { color: s.textColor }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Absent List */}
        {absentees.length > 0 && (
          <View style={styles.absentCard}>
            <Text style={styles.absentTitle}>Absent Students</Text>
            {absentees.map((name, i) => (
              <View key={i} style={[styles.absentRow, i > 0 && styles.absentBorder]}>
                <Text style={styles.absentName}>{name}</Text>
                <View style={[styles.badge, { backgroundColor: Colors.redBg }]}>
                  <Text style={[styles.badgeText, { color: Colors.redText }]}>Absent</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {absentees.length === 0 && (
          <View style={styles.allPresentCard}>
            <Text style={styles.allPresentIcon}>🎉</Text>
            <Text style={styles.allPresentText}>Full attendance today!</Text>
          </View>
        )}

        {/* Notify Toggle */}
        <View style={styles.notifyCard}>
          <View style={[styles.notifyIcon, { backgroundColor: Colors.greenBg }]}>
            <Text style={{ fontSize: 18 }}>📱</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notifyTitle}>Notify Parents</Text>
            <Text style={styles.notifySub}>Send SMS to absent parents</Text>
          </View>
          <View style={styles.toggleOn}>
            <View style={styles.toggleThumb} />
          </View>
        </View>
      </ScrollView>

      {/* Button */}
      <View style={styles.btnStrip}>
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/tabs')} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 32,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle1: { position: 'absolute', top: -50, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.1)' },
  decorCircle2: { position: 'absolute', bottom: -40, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.07)' },
  checkCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  checkMark: { fontSize: 30, color: Colors.white },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  statsGrid: { flexDirection: 'row', gap: 8, margin: 16 },
  statCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', ...Shadow.sm },
  statNum: { fontSize: 26, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 3 },
  absentCard: { marginHorizontal: Spacing.lg, marginBottom: 10, backgroundColor: Colors.card, borderRadius: 14, padding: Spacing.lg, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  absentTitle: { fontSize: 11, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  absentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  absentBorder: { borderTopWidth: 1, borderTopColor: Colors.surface },
  absentName: { fontSize: 13, fontWeight: '500', color: Colors.text1 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  allPresentCard: { marginHorizontal: Spacing.lg, marginBottom: 10, backgroundColor: Colors.greenBg, borderRadius: 14, padding: 20, alignItems: 'center', ...Shadow.sm },
  allPresentIcon: { fontSize: 32, marginBottom: 8 },
  allPresentText: { fontSize: 14, fontWeight: '700', color: Colors.greenText },
  notifyCard: { marginHorizontal: Spacing.lg, marginBottom: 10, backgroundColor: Colors.card, borderRadius: 14, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 14, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  notifyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notifyTitle: { fontSize: 13, fontWeight: '600', color: Colors.text1 },
  notifySub: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  toggleOn: { width: 44, height: 24, borderRadius: 12, backgroundColor: Colors.green, position: 'relative', justifyContent: 'center' },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.white, position: 'absolute', right: 2 },
  btnStrip: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  doneBtn: { backgroundColor: Colors.purple, borderRadius: Radius.lg, padding: 15, alignItems: 'center' },
  doneBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});
