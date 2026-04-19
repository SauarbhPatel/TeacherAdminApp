/**
 * marks-students.tsx
 *
 * Shows list of students for a selected class/section/exam.
 * Tap any student to open marks entry form.
 */

import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { getMockMarksStudents } from '@/constants/data';

// Grade → colour
const GRADE_COLOR: Record<string, { bg: string; text: string }> = {
  A1: { bg: '#e6f9ef', text: '#0a6640' },
  A2: { bg: '#e7f9f0', text: '#0a6640' },
  B1: { bg: '#eff8ff', text: '#1849a9' },
  B2: { bg: '#eff8ff', text: '#1849a9' },
  C1: { bg: '#fffaeb', text: '#93370d' },
  C2: { bg: '#fffaeb', text: '#93370d' },
  D:  { bg: '#fef3f2', text: '#b42318' },
};
function gradeStyle(g: string) {
  return GRADE_COLOR[g] ?? { bg: Colors.surface, text: Colors.text3 };
}

// Percent bar
function PctBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={{ height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
      <View style={{ width: `${Math.min(pct, 100)}%`, height: 4, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

export default function MarksStudentsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    class_id: string; class_name: string;
    section_id: string; section_name: string;
    exam_id: string; exam_name: string;
  }>();
  const { class_id, class_name, section_id, section_name, exam_id, exam_name } = params;

  const [search, setSearch] = useState('');

  // Load mock students (swap with real API later)
  const allStudents = useMemo(() =>
    getMockMarksStudents(class_id, section_id, class_name, section_name, exam_id),
    [class_id, section_id, exam_id]
  );

  const students = useMemo(() =>
    allStudents.filter(s =>
      !search ||
      s.student_name.toLowerCase().includes(search.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(search.toLowerCase())
    ),
    [allStudents, search]
  );

  // Summary stats
  const summary = useMemo(() => {
    const grades: Record<string, number> = {};
    let totalPct = 0;
    allStudents.forEach(s => {
      const exam = s.exams[0];
      if (exam) {
        grades[exam.grade_name] = (grades[exam.grade_name] || 0) + 1;
        totalPct += parseFloat(exam.percentage);
      }
    });
    return {
      total: allStudents.length,
      avgPct: allStudents.length ? (totalPct / allStudents.length).toFixed(1) : '0',
      grades,
    };
  }, [allStudents]);

  // Color for percentage
  const pctColor = (p: string) => {
    const n = parseFloat(p);
    if (n >= 80) return Colors.green;
    if (n >= 60) return Colors.blue;
    if (n >= 40) return Colors.amber;
    return Colors.red;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>

      {/* ── Header ── */}
      <LinearGradient
        colors={[Colors.purple, Colors.purpleDeeper]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.decor1} />
        <View style={styles.decor2} />

        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Class {class_name}-{section_name}  ·  {exam_name}
            </Text>
            <Text style={styles.headerSub}>{summary.total} students · Avg {summary.avgPct}%</Text>
          </View>
        </View>

        {/* Summary pills */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryPill}>
            <Text style={styles.sumNum}>{summary.total}</Text>
            <Text style={styles.sumLbl}>Total</Text>
          </View>
          <View style={styles.summaryPill}>
            <Text style={[styles.sumNum, { color: '#4ade80' }]}>{summary.avgPct}%</Text>
            <Text style={styles.sumLbl}>Avg Score</Text>
          </View>
          {Object.entries(summary.grades).slice(0, 3).map(([g, count]) => (
            <View key={g} style={styles.summaryPill}>
              <Text style={[styles.sumNum, { color: '#fbbf24' }]}>{count}</Text>
              <Text style={styles.sumLbl}>Grade {g}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      {/* ── Search ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 15 }}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or admission no…"
            placeholderTextColor={Colors.text3}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: Colors.text3, fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Student list ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, paddingTop: 8, gap: 8, paddingBottom: 32 }}>
        {search ? (
          <Text style={styles.resultCount}>{students.length} result{students.length !== 1 ? 's' : ''}</Text>
        ) : null}

        {students.map((student, idx) => {
          const exam = student.exams[0];
          const pct = exam ? parseFloat(exam.percentage) : 0;
          const barColor = pctColor(exam?.percentage ?? '0');
          const gs = gradeStyle(exam?.grade_name ?? '');
          const initials = student.student_name.trim().split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

          return (
            <TouchableOpacity
              key={student.student_session_id}
              style={styles.studentCard}
              onPress={() =>
                router.push({
                  pathname: '/screens/marks-form',
                  params: {
                    student_data: JSON.stringify(student),
                    exam_name,
                    class_name,
                    section_name,
                  },
                })
              }
              activeOpacity={0.82}
            >
              {/* Left: avatar + info */}
              <View style={styles.cardLeft}>
                <View style={[styles.avatar, { backgroundColor: Colors.purpleBg }]}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{student.student_name.trim()}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaChip}>#{student.admission_no}</Text>
                    {student.father_name ? (
                      <Text style={styles.metaGray}>👤 {student.father_name}</Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Right: score info */}
              <View style={styles.cardRight}>
                <View style={[styles.gradeBadge, { backgroundColor: gs.bg }]}>
                  <Text style={[styles.gradeText, { color: gs.text }]}>{exam?.grade_name ?? '—'}</Text>
                </View>
                <Text style={[styles.scoreText, { color: barColor }]}>
                  {exam ? `${exam.marks_obtained}/${exam.max_marks}` : '—'}
                </Text>
                <Text style={[styles.pctText, { color: barColor }]}>{exam?.percentage ?? '0'}%</Text>
              </View>

              {/* Progress bar + edit hint */}
              <View style={{ width: '100%', marginTop: 4 }}>
                <PctBar pct={pct} color={barColor} />
                <Text style={styles.editHint}>Tap to edit marks →</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {students.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, position: 'relative', overflow: 'hidden' },
  decor1: { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)' },
  decor2: { position: 'absolute', bottom: -50, left: 10, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.04)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, zIndex: 1 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },

  summaryRow: { flexDirection: 'row', gap: 8, zIndex: 1 },
  summaryPill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  sumNum: { fontSize: 16, fontWeight: '900', color: '#fff' },
  sumLbl: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  searchWrap: { backgroundColor: Colors.surface, padding: Spacing.lg, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.card, borderRadius: Radius.md, padding: 12, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text1 },
  resultCount: { fontSize: 12, color: Colors.text3, fontWeight: '600', marginBottom: 4 },

  studentCard: {
    backgroundColor: Colors.card, borderRadius: Radius.xl,
    padding: 14, flexWrap: 'wrap', flexDirection: 'row',
    alignItems: 'center', gap: 10,
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 14, fontWeight: '800', color: Colors.purple },
  studentName: { fontSize: 14, fontWeight: '700', color: Colors.text1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  metaChip: { fontSize: 10, fontWeight: '600', color: Colors.purple, backgroundColor: Colors.purpleBg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  metaGray: { fontSize: 10, color: Colors.text3 },

  cardRight: { alignItems: 'flex-end', gap: 2 },
  gradeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  gradeText: { fontSize: 11, fontWeight: '800' },
  scoreText: { fontSize: 13, fontWeight: '800' },
  pctText: { fontSize: 11, fontWeight: '600' },
  editHint: { fontSize: 10, color: Colors.text3, marginTop: 4, textAlign: 'right', fontStyle: 'italic' },

  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.text3 },
});
