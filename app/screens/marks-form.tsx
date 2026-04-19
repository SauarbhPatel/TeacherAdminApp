/**
 * marks-form.tsx
 *
 * Per-student marks entry form.
 * Shows all subjects with editable marks_obtained fields.
 * Real-time grade + percentage calculation as you type.
 * Swap → API save when live endpoint is provided.
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Keyboard, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Types ───────────────────────────────────────────────
interface SubjectMark {
  subject_id: string;
  subject_name: string;
  max_marks: number;
  marks_obtained: number;
  percentage: string;
  grade_name: string;
  grade_point: string;
}

interface ExamRecord {
  exam_id: string;
  exam_name: string;
  max_marks: number;
  marks_obtained: number;
  percentage: string;
  grade_name: string;
  subjects: SubjectMark[];
}

interface StudentData {
  student_id: string;
  student_session_id: string;
  student_name: string;
  father_name: string;
  admission_no: string;
  class: string;
  section: string;
  exams: ExamRecord[];
}

// ─── Grade calculation ────────────────────────────────────
function calcGrade(obtained: number, max: number): { pct: string; grade: string; gp: string } {
  if (max === 0) return { pct: '0', grade: '—', gp: '0.00' };
  const p = (obtained / max) * 100;
  const pct = p.toFixed(1);
  const grade = p >= 91 ? 'A1' : p >= 81 ? 'A2' : p >= 71 ? 'B1' : p >= 61 ? 'B2' : p >= 51 ? 'C1' : p >= 41 ? 'C2' : 'D';
  const gp = p >= 91 ? '10.0' : p >= 81 ? '9.0' : p >= 71 ? '8.0' : p >= 61 ? '7.0' : p >= 51 ? '6.0' : p >= 41 ? '5.0' : '4.0';
  return { pct, grade, gp };
}

const GRADE_BG: Record<string, { bg: string; color: string }> = {
  A1: { bg: '#e6f9ef', color: '#0a6640' },
  A2: { bg: '#e7f9f0', color: '#0a6640' },
  B1: { bg: '#eff8ff', color: '#1849a9' },
  B2: { bg: '#eff8ff', color: '#1849a9' },
  C1: { bg: '#fffaeb', color: '#93370d' },
  C2: { bg: '#fffaeb', color: '#93370d' },
  D:  { bg: '#fef3f2', color: '#b42318' },
  '—': { bg: Colors.surface, color: Colors.text3 },
};

function gradeChip(grade: string) {
  return GRADE_BG[grade] ?? { bg: Colors.surface, color: Colors.text3 };
}

// ─── Per-subject row ──────────────────────────────────────
function SubjectRow({
  subject,
  value,
  onChange,
}: {
  subject: SubjectMark;
  value: string;
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);

  const obtained = parseInt(value) || 0;
  const { pct, grade, gp } = calcGrade(obtained, subject.max_marks);
  const gc = gradeChip(grade);
  const pctNum = parseFloat(pct);
  const barColor = pctNum >= 80 ? Colors.green : pctNum >= 60 ? Colors.blue : pctNum >= 40 ? Colors.amber : Colors.red;
  const isError = obtained > subject.max_marks;

  return (
    <View style={[subj.card, focused && subj.cardFocused, isError && subj.cardError]}>
      {/* Subject name row */}
      <View style={subj.topRow}>
        <View style={subj.subjectIconWrap}>
          <Text style={subj.subjectInitial}>{subject.subject_name[0]}</Text>
        </View>
        <Text style={subj.subjectName}>{subject.subject_name}</Text>
        <View style={[subj.gradePill, { backgroundColor: gc.bg }]}>
          <Text style={[subj.gradeText, { color: gc.color }]}>{grade}</Text>
        </View>
      </View>

      {/* Marks input row */}
      <View style={subj.inputRow}>
        {/* Editable marks */}
        <View style={[subj.inputWrap, focused && subj.inputWrapFocused, isError && subj.inputWrapError]}>
          <TextInput
            style={subj.input}
            value={value}
            onChangeText={v => {
              // only digits
              const clean = v.replace(/[^0-9]/g, '');
              onChange(clean);
            }}
            keyboardType="numeric"
            maxLength={3}
            selectTextOnFocus
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="—"
            placeholderTextColor={Colors.text3}
          />
        </View>
        <Text style={subj.slash}>/</Text>
        <Text style={subj.maxMarks}>{subject.max_marks}</Text>

        <View style={{ flex: 1 }} />

        {/* Percentage */}
        <Text style={[subj.pctText, { color: isError ? Colors.red : barColor }]}>
          {isError ? 'Over max' : `${pct}%`}
        </Text>

        {/* Grade point */}
        <View style={subj.gpWrap}>
          <Text style={subj.gpLabel}>GP</Text>
          <Text style={[subj.gpValue, { color: gc.color }]}>{gp}</Text>
        </View>
      </View>

      {/* Progress bar */}
      {!isError && (
        <View style={subj.barWrap}>
          <View style={[subj.barFill, { width: `${Math.min(pctNum, 100)}%`, backgroundColor: barColor }]} />
        </View>
      )}
      {isError && (
        <Text style={subj.errorMsg}>⚠ Marks cannot exceed maximum ({subject.max_marks})</Text>
      )}
    </View>
  );
}

const subj = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 14, ...Shadow.sm,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  cardFocused: { borderColor: Colors.purple },
  cardError: { borderColor: Colors.red },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  subjectIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.purpleBg, alignItems: 'center', justifyContent: 'center' },
  subjectInitial: { fontSize: 14, fontWeight: '800', color: Colors.purple },
  subjectName: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text1 },
  gradePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  gradeText: { fontSize: 12, fontWeight: '800' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputWrap: {
    width: 62, height: 44, borderRadius: Radius.md,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  inputWrapFocused: { borderColor: Colors.purple, backgroundColor: Colors.purplePale },
  inputWrapError: { borderColor: Colors.red, backgroundColor: Colors.redBg },
  input: { fontSize: 20, fontWeight: '900', color: Colors.text1, textAlign: 'center', width: '100%' },
  slash: { fontSize: 18, color: Colors.text3, fontWeight: '300' },
  maxMarks: { fontSize: 15, fontWeight: '600', color: Colors.text2 },
  pctText: { fontSize: 13, fontWeight: '700' },
  gpWrap: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  gpLabel: { fontSize: 8, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase' },
  gpValue: { fontSize: 12, fontWeight: '800' },
  barWrap: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 10 },
  barFill: { height: 4, borderRadius: 2 },
  errorMsg: { fontSize: 11, color: Colors.red, marginTop: 6, fontWeight: '600' },
});

// ─── Save Toast ───────────────────────────────────────────
function SaveToast({ visible }: { visible: boolean }) {
  const opacity = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <Animated.View style={[toast.wrap, { opacity }]} pointerEvents="none">
      <Text style={toast.text}>✓  Marks saved successfully</Text>
    </Animated.View>
  );
}
const toast = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    backgroundColor: Colors.green, borderRadius: 24,
    paddingHorizontal: 22, paddingVertical: 10, zIndex: 999,
    shadowColor: Colors.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
});

// ─── Main Screen ─────────────────────────────────────────
export default function MarksFormScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    student_data: string;
    exam_name: string;
    class_name: string;
    section_name: string;
  }>();

  const student: StudentData = JSON.parse(params.student_data ?? '{}');
  const exam = student.exams?.[0];

  // Local editable marks state — key: subject_id → marks string
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    exam?.subjects.forEach(s => { init[s.subject_id] = String(s.marks_obtained); });
    return init;
  });

  const [saved, setSaved] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateMark = useCallback((subjectId: string, value: string) => {
    setSaved(false);
    setMarks(prev => ({ ...prev, [subjectId]: value }));
  }, []);

  // Totals derived live from current state
  const totals = useMemo(() => {
    if (!exam) return { obtained: 0, max: 0, pct: '0', grade: '—' };
    let obtained = 0, max = 0;
    exam.subjects.forEach(s => {
      obtained += parseInt(marks[s.subject_id] ?? '0') || 0;
      max += s.max_marks;
    });
    const { pct, grade } = calcGrade(obtained, max);
    return { obtained, max, pct, grade };
  }, [marks, exam]);

  const hasErrors = useMemo(() =>
    exam?.subjects.some(s => {
      const v = parseInt(marks[s.subject_id] ?? '0') || 0;
      return v > s.max_marks;
    }) ?? false,
    [marks, exam]
  );

  const handleSave = () => {
    Keyboard.dismiss();
    if (hasErrors) {
      Alert.alert('Invalid Marks', 'Some marks exceed the maximum allowed. Please fix before saving.');
      return;
    }
    // TODO: call real API when endpoint is provided
    setSaved(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 2000);
  };

  const initials = student.student_name?.trim().split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'ST';
  const totalGc = gradeChip(totals.grade);
  const totalPct = parseFloat(totals.pct);
  const totalBarColor = totalPct >= 80 ? Colors.green : totalPct >= 60 ? Colors.blue : totalPct >= 40 ? Colors.amber : Colors.red;

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>

      {/* ── Header ── */}
      <LinearGradient colors={[Colors.purple, Colors.purpleDeeper]} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.decor} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Student info card in header */}
        <View style={styles.studentCard}>
          <View style={styles.studentAvatar}>
            <Text style={styles.studentAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{student.student_name?.trim()}</Text>
            <Text style={styles.studentMeta}>
              #{student.admission_no}
              {student.father_name ? `  ·  👤 ${student.father_name}` : ''}
            </Text>
          </View>
          <View style={styles.examTag}>
            <Text style={styles.examTagText}>{params.exam_name}</Text>
          </View>
        </View>

        {/* Live total score bar */}
        <View style={styles.totalRow}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalLabel}>Total Score</Text>
            <Text style={styles.totalScore}>{totals.obtained}<Text style={styles.totalMax}>/{totals.max}</Text></Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: 16 }}>
            <View style={styles.totalBarBg}>
              <Animated.View style={[styles.totalBarFill, { width: `${Math.min(totalPct, 100)}%`, backgroundColor: '#fff' }]} />
            </View>
            <Text style={styles.totalPct}>{totals.pct}%</Text>
          </View>
          <View style={[styles.totalGrade, { backgroundColor: totalGc.bg }]}>
            <Text style={styles.totalGradeLabel}>Grade</Text>
            <Text style={[styles.totalGradeValue, { color: totalGc.color }]}>{totals.grade}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Subject rows ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: Spacing.lg, gap: 10, paddingBottom: 100 }}
      >
        <Text style={styles.sectionLabel}>
          Subject-wise Marks  ·  {exam?.subjects.length ?? 0} subjects
        </Text>

        {exam?.subjects.map(subject => (
          <SubjectRow
            key={subject.subject_id}
            subject={subject}
            value={marks[subject.subject_id] ?? ''}
            onChange={v => updateMark(subject.subject_id, v)}
          />
        ))}

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Summary</Text>
          <View style={styles.summaryGrid}>
            {[
              { label: 'Total Marks', val: `${totals.obtained}/${totals.max}` },
              { label: 'Percentage', val: `${totals.pct}%` },
              { label: 'Grade', val: totals.grade },
              { label: 'Class', val: `${params.class_name}-${params.section_name}` },
            ].map((item, i) => (
              <View key={i} style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{item.label}</Text>
                <Text style={styles.summaryItemVal}>{item.val}</Text>
              </View>
            ))}
          </View>
          {/* Total bar */}
          <View style={{ marginTop: 12 }}>
            <View style={styles.fullBar}>
              <View style={[styles.fullBarFill, { width: `${Math.min(totalPct, 100)}%`, backgroundColor: totalBarColor }]} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Save button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, hasErrors && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={hasErrors}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={hasErrors ? ['#ccc', '#ccc'] : saved ? [Colors.green, '#0a8a50'] : [Colors.purple, Colors.purpleDark]}
            style={styles.saveBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.saveBtnText}>
              {hasErrors ? '⚠ Fix errors before saving' : saved ? '✓ Marks Saved!' : 'Save Marks'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <SaveToast visible={showToast} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg, position: 'relative', overflow: 'hidden' },
  decor: { position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)' },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, zIndex: 1 },
  backArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },

  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, zIndex: 1 },
  studentAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  studentAvatarText: { fontSize: 16, fontWeight: '900', color: '#fff' },
  studentName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  studentMeta: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  examTag: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  examTagText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  totalRow: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  totalLeft: {},
  totalLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' },
  totalScore: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 2 },
  totalMax: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  totalBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  totalBarFill: { height: 6, borderRadius: 3 },
  totalPct: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 4, textAlign: 'right' },
  totalGrade: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  totalGradeLabel: { fontSize: 9, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase' },
  totalGradeValue: { fontSize: 18, fontWeight: '900' },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },

  summaryCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 16, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.text1, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { width: '45%' },
  summaryItemLabel: { fontSize: 10, fontWeight: '600', color: Colors.text3, textTransform: 'uppercase', marginBottom: 2 },
  summaryItemVal: { fontSize: 16, fontWeight: '800', color: Colors.text1 },
  fullBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  fullBarFill: { height: 8, borderRadius: 4 },

  footer: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
  saveBtn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
});
