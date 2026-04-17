import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { NAMES } from '@/constants/data';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Chip, PrimaryButton } from '@/components/ui';

const CLASS_TABS = [
  { id: '5A', label: 'Class 5-A' },
  { id: '6B', label: 'Class 6-B' },
  { id: '4C', label: 'Class 4-C' },
];

const EXAM_TYPES = ['Unit Test 1', 'Mid-Term', 'Unit Test 2', 'Final Exam'];

function getGrade(s: number): { grade: string; color: string } {
  if (s >= 45) return { grade: 'A', color: Colors.green };
  if (s >= 35) return { grade: 'B', color: Colors.blue };
  if (s >= 25) return { grade: 'C', color: Colors.amber };
  return { grade: 'D', color: Colors.red };
}

export default function MarksScreen() {
  const insets = useSafeAreaInsets();
  const [activeClass, setActiveClass] = useState('5A');
  const [examType, setExamType] = useState('Unit Test 1');
  const { marksData, initMarks, setMark } = useAppContext();

  useEffect(() => {
    CLASS_TABS.forEach(t => initMarks(t.id));
  }, []);

  const names = NAMES[activeClass] || [];
  const marks = marksData[activeClass] || {};

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top }}>
      <ScreenHeader title="Marks & Grades" subtitle="Enter exam scores" />

      {/* Class Selector */}
      <View style={styles.tabsRow}>
        {CLASS_TABS.map(t => (
          <Chip key={t.id} label={t.label} active={activeClass === t.id} onPress={() => setActiveClass(t.id)} style={{ flex: 1 }} />
        ))}
      </View>

      {/* Exam Type */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.examRow}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {EXAM_TYPES.map(e => (
          <TouchableOpacity
            key={e}
            style={[styles.examChip, examType === e && styles.examChipActive]}
            onPress={() => setExamType(e)}
            activeOpacity={0.8}
          >
            <Text style={[styles.examChipText, examType === e && styles.examChipTextActive]}>{e}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Table */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1 }]}>Student</Text>
            <Text style={[styles.headerCell, { width: 60, textAlign: 'center' }]}>Score</Text>
            <Text style={[styles.headerCell, { width: 40, textAlign: 'center' }]}>/50</Text>
            <Text style={[styles.headerCell, { width: 50, textAlign: 'center' }]}>Grade</Text>
          </View>

          {names.map((name, i) => {
            const roll = i + 1;
            const score = marks[roll] ?? 0;
            const { grade, color } = getGrade(score);
            const rowBg = i % 2 === 0 ? Colors.card : Colors.surface;
            return (
              <View key={roll} style={[styles.tableRow, { backgroundColor: rowBg }]}>
                <Text style={[styles.nameCell, { flex: 1 }]} numberOfLines={1}>
                  {name.split(' ')[0]} {name.split(' ')[1]?.[0]}.
                </Text>
                <View style={{ width: 60, alignItems: 'center' }}>
                  <TextInput
                    style={styles.scoreInput}
                    value={String(score)}
                    onChangeText={val => {
                      const n = parseInt(val) || 0;
                      setMark(activeClass, roll, Math.min(50, Math.max(0, n)));
                    }}
                    keyboardType="numeric"
                    maxLength={2}
                    selectTextOnFocus
                  />
                </View>
                <Text style={[styles.outOfCell, { width: 40 }]}>50</Text>
                <Text style={[styles.gradeCell, { width: 50, color }]}>{grade}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.btnStrip}>
        <PrimaryButton label="Save Marks ✓" onPress={() => router.back()} color={Colors.green} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRow: { flexDirection: 'row', gap: 8, padding: 12, paddingHorizontal: Spacing.lg, backgroundColor: Colors.surface },
  examRow: { paddingHorizontal: Spacing.lg, paddingVertical: 8, backgroundColor: Colors.surface },
  examChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  examChipActive: { backgroundColor: Colors.purple, borderColor: Colors.purple },
  examChipText: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  examChipTextActive: { color: Colors.white },
  table: { marginHorizontal: Spacing.lg, marginTop: 12, borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  tableHeader: { flexDirection: 'row', backgroundColor: Colors.purple, padding: 10, paddingHorizontal: 14 },
  headerCell: { fontSize: 11, fontWeight: '700', color: Colors.white },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  nameCell: { fontSize: 12, fontWeight: '600', color: Colors.text1 },
  scoreInput: {
    width: 38, height: 28, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 6, textAlign: 'center', fontSize: 13, fontWeight: '700',
    color: Colors.text1, backgroundColor: Colors.white,
  },
  outOfCell: { fontSize: 11, color: Colors.text3, textAlign: 'center' },
  gradeCell: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  btnStrip: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
});
