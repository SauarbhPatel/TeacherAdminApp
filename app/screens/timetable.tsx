import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TIMETABLE } from '@/constants/data';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TimetableScreen() {
  const insets = useSafeAreaInsets();
  const [activeDay, setActiveDay] = useState('Thu');

  const slots = TIMETABLE[activeDay] || [];

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top }}>
      <ScreenHeader title="Timetable" subtitle="Weekly schedule" />

      {/* Day Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.dayTabRow}
        contentContainerStyle={{ gap: 6, paddingRight: 8 }}
      >
        {DAYS.map(d => (
          <TouchableOpacity
            key={d}
            style={[styles.dayTab, activeDay === d && styles.dayTabActive]}
            onPress={() => setActiveDay(d)}
            activeOpacity={0.8}
          >
            <Text style={[styles.dayTabText, activeDay === d && styles.dayTabTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, gap: 8 }}>
        {slots.map((slot, i) => (
          <View key={i} style={[styles.slot, slot.free && styles.slotFree]}>
            <Text style={styles.slotTime}>{slot.time}</Text>
            <View style={[styles.slotLine, { backgroundColor: slot.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.slotName, slot.free && styles.slotNameFree]}>{slot.cls}</Text>
              <Text style={styles.slotDetail}>
                {slot.sub}{slot.room ? ` · ${slot.room}` : ''}
              </Text>
            </View>
            <Text style={styles.slotIcon}>{slot.icon}</Text>
          </View>
        ))}
        {slots.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>No classes scheduled</Text>
          </View>
        )}
        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dayTabRow: { paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.surface },
  dayTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  dayTabActive: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  dayTabText: { fontSize: 13, fontWeight: '700', color: Colors.text2 },
  dayTabTextActive: { color: Colors.white },
  slot: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  slotFree: { backgroundColor: Colors.surface, borderStyle: 'dashed' },
  slotTime: { fontSize: 11, fontWeight: '700', color: Colors.text2, minWidth: 60 },
  slotLine: { width: 3, borderRadius: 2, alignSelf: 'stretch', minHeight: 40 },
  slotName: { fontSize: 14, fontWeight: '700', color: Colors.text1 },
  slotNameFree: { color: Colors.text3 },
  slotDetail: { fontSize: 11, color: Colors.text2, marginTop: 2 },
  slotIcon: { fontSize: 22 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.text3 },
});
