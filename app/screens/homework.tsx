import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Chip, PrimaryButton } from '@/components/ui';

type HwTab = 'active' | 'submitted' | 'graded';

const TABS: { id: HwTab; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'graded', label: 'Graded' },
];

export default function HomeworkScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<HwTab>('active');
  const { homework } = useAppContext();
  const items = homework[tab] || [];

  const getStatusStyle = (t: HwTab) => {
    if (t === 'active') return { bg: Colors.amberBg, color: Colors.amberText, label: 'Pending' };
    if (t === 'submitted') return { bg: Colors.purpleBg, color: Colors.purple, label: 'Submitted' };
    return { bg: Colors.greenBg, color: Colors.greenText, label: 'Graded' };
  };
  const st = getStatusStyle(tab);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top }}>
      <ScreenHeader title="Homework" subtitle="Assignments & tasks" />

      <View style={styles.tabsRow}>
        {TABS.map(t => (
          <Chip key={t.id} label={t.label} active={tab === t.id} onPress={() => setTab(t.id)} style={{ flex: 1 }} />
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, paddingTop: 12 }}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No {tab} assignments</Text>
          </View>
        ) : items.map((hw, i) => (
          <View key={i} style={styles.hwCard}>
            <View style={styles.hwTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hwClass}>{hw.cls}</Text>
                <Text style={styles.hwSub}>{hw.sub}</Text>
              </View>
              <Text style={styles.hwDue}>Due {hw.due}</Text>
            </View>
            <Text style={styles.hwTitle}>{hw.title}</Text>
            <Text style={styles.hwDesc}>{hw.desc}</Text>
            <View style={styles.hwFooter}>
              <View style={[styles.chip, { backgroundColor: Colors.blueBg }]}>
                <Text style={[styles.chipText, { color: Colors.blueText }]}>{hw.tag}</Text>
              </View>
              <View style={[styles.chip, { backgroundColor: st.bg }]}>
                <Text style={[styles.chipText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 10 }} />
      </ScrollView>

      <View style={styles.addStrip}>
        <PrimaryButton label="＋  Assign New Homework" onPress={() => router.push('/screens/add-homework')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: { flexDirection: 'row', gap: 8, padding: 12, paddingHorizontal: Spacing.lg, backgroundColor: Colors.surface },
  hwCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: Spacing.lg,
    marginBottom: 10, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  hwTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  hwClass: { fontSize: 14, fontWeight: '700', color: Colors.text1 },
  hwSub: { fontSize: 11, color: Colors.text2, marginTop: 2 },
  hwDue: { fontSize: 11, color: Colors.red, fontWeight: '600' },
  hwTitle: { fontSize: 13, fontWeight: '600', color: Colors.text1, marginBottom: 4 },
  hwDesc: { fontSize: 12, color: Colors.text2, lineHeight: 18 },
  hwFooter: { flexDirection: 'row', gap: 6, marginTop: 10 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.text3 },
  addStrip: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
});
