/**
 * marks-form.tsx
 *
 * Per-student subject marks editor.
 * - Prefills marks_obtained from marksheet API data.
 * - Each subject row is individually editable.
 * - On blur/save → calls POST /Webservice/saveStudentMarksEntry for that subject.
 * - Live grade + percentage recalculation as user types.
 */

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Keyboard, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { saveStudentMarksEntry } from '@/services/api';
import { MarksStudent, MarksSubject } from '@/types';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── Grade calculation ────────────────────────────────────
function calcGrade(obtained: number, max: number) {
  if (max === 0) return { pct: '0.0', grade: '—', gp: '0.0' };
  const p = (obtained / max) * 100;
  return {
    pct: p.toFixed(1),
    grade: p >= 91 ? 'A1' : p >= 81 ? 'A2' : p >= 71 ? 'B1' : p >= 61 ? 'B2' : p >= 51 ? 'C1' : p >= 41 ? 'C2' : 'D',
    gp:   p >= 91 ? '10.0' : p >= 81 ? '9.0' : p >= 71 ? '8.0' : p >= 61 ? '7.0' : p >= 51 ? '6.0' : p >= 41 ? '5.0' : '4.0',
  };
}

const GRADE_STYLE: Record<string, { bg: string; color: string }> = {
  A1: { bg: '#e6f9ef', color: '#0a6640' },
  A2: { bg: '#e7f9f0', color: '#0a6640' },
  B1: { bg: '#eff8ff', color: '#1849a9' },
  B2: { bg: '#eff8ff', color: '#1849a9' },
  C1: { bg: '#fffaeb', color: '#93370d' },
  C2: { bg: '#fffaeb', color: '#93370d' },
  D:  { bg: '#fef3f2', color: '#b42318' },
  '—': { bg: Colors.surface, color: Colors.text3 },
};

// ─── Save toast ───────────────────────────────────────────
function SaveToast({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <Animated.View style={[toast.wrap, { opacity }]} pointerEvents="none">
      <Text style={toast.txt}>✓  Marks saved</Text>
    </Animated.View>
  );
}
const toast = StyleSheet.create({
  wrap: { position: 'absolute', bottom: 90, alignSelf: 'center', backgroundColor: Colors.green, borderRadius: 24, paddingHorizontal: 22, paddingVertical: 10, zIndex: 999, shadowColor: Colors.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  txt: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
});

// ─── Subject Row ─────────────────────────────────────────
interface SubjectRowProps {
  subject: MarksSubject;
  value: string;
  saving: boolean;
  savedOk: boolean;
  onChange: (v: string) => void;
  onSave: () => void;
}

function SubjectRow({ subject, value, saving, savedOk, onChange, onSave }: SubjectRowProps) {
  const [focused, setFocused] = useState(false);

  const obtained = parseInt(value) || 0;
  const { pct, grade, gp } = calcGrade(obtained, subject.max_marks);
  const gs = GRADE_STYLE[grade] ?? GRADE_STYLE['—'];
  const pctNum = parseFloat(pct);
  const barColor = pctNum >= 80 ? Colors.green : pctNum >= 60 ? Colors.blue : pctNum >= 40 ? Colors.amber : Colors.red;
  const isError = obtained > subject.max_marks;

  return (
    <View style={[srow.card, focused && srow.focused, isError && srow.errCard]}>
      {/* Subject header */}
      <View style={srow.topRow}>
        <View style={srow.iconWrap}>
          <Text style={srow.iconTxt}>{subject.subject_name[0]}</Text>
        </View>
        <Text style={srow.subjectName}>{subject.subject_name}</Text>
        <View style={[srow.gradePill, { backgroundColor: gs.bg }]}>
          <Text style={[srow.gradeText, { color: gs.color }]}>{grade}</Text>
        </View>
        {savedOk && !isError && (
          <Text style={srow.savedMark}>✓</Text>
        )}
      </View>

      {/* Marks input */}
      <View style={srow.inputRow}>
        <View style={[srow.inputWrap, focused && srow.inputFocused, isError && srow.inputErr]}>
          <TextInput
            style={srow.input}
            value={value}
            onChangeText={v => onChange(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            maxLength={3}
            selectTextOnFocus
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); if (!isError && value !== '') onSave(); }}
            placeholder="—"
            placeholderTextColor={Colors.text3}
          />
        </View>
        <Text style={srow.slash}>/</Text>
        <Text style={srow.maxMark}>{subject.max_marks}</Text>
        <View style={{ flex: 1 }} />
        {saving ? (
          <ActivityIndicator size="small" color={Colors.purple} />
        ) : (
          <Text style={[srow.pctTxt, { color: isError ? Colors.red : barColor }]}>
            {isError ? 'Over max!' : `${pct}%`}
          </Text>
        )}
        <View style={srow.gpWrap}>
          <Text style={srow.gpLbl}>GP</Text>
          <Text style={[srow.gpVal, { color: gs.color }]}>{gp}</Text>
        </View>
      </View>

      {/* Bar or error */}
      {isError ? (
        <Text style={srow.errMsg}>⚠ Maximum allowed: {subject.max_marks}</Text>
      ) : (
        <View style={srow.barWrap}>
          <View style={[srow.barFill, { width: `${Math.min(pctNum, 100)}%`, backgroundColor: barColor }]} />
        </View>
      )}
    </View>
  );
}

const srow = StyleSheet.create({
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, ...Shadow.sm, borderWidth: 1.5, borderColor: Colors.border },
  focused: { borderColor: Colors.purple },
  errCard: { borderColor: Colors.red },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.purpleBg, alignItems: 'center', justifyContent: 'center' },
  iconTxt: { fontSize: 14, fontWeight: '800', color: Colors.purple },
  subjectName: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.text1 },
  gradePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  gradeText: { fontSize: 12, fontWeight: '800' },
  savedMark: { fontSize: 14, color: Colors.green, fontWeight: '900', marginLeft: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputWrap: { width: 62, height: 44, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  inputFocused: { borderColor: Colors.purple, backgroundColor: Colors.purplePale },
  inputErr: { borderColor: Colors.red, backgroundColor: Colors.redBg },
  input: { fontSize: 20, fontWeight: '900', color: Colors.text1, textAlign: 'center', width: '100%' },
  slash: { fontSize: 18, color: Colors.text3 },
  maxMark: { fontSize: 15, fontWeight: '600', color: Colors.text2 },
  pctTxt: { fontSize: 13, fontWeight: '700' },
  gpWrap: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  gpLbl: { fontSize: 8, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase' },
  gpVal: { fontSize: 12, fontWeight: '800' },
  barWrap: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginTop: 10 },
  barFill: { height: 4, borderRadius: 2 },
  errMsg: { fontSize: 11, color: Colors.red, marginTop: 6, fontWeight: '600' },
});

// ─── Main Screen ─────────────────────────────────────────
export default function MarksFormScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    student_data: string;
    exam_name: string;
    class_name: string;
    section_name: string;
    class_id: string;
    section_id: string;
    exam_master_id: string;
  }>();

  const student: MarksStudent = JSON.parse(params.student_data ?? '{}');
  const exam = student.exams?.[0];

  // ── Local marks state: subject_id → value string ────────
  const [marks, setMarks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    exam?.subjects.forEach(s => { init[s.subject_id] = String(s.marks_obtained); });
    return init;
  });

  // ── Per-subject save state ──────────────────────────────
  const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});
  const [savedMap, setSavedMap]   = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    exam?.subjects.forEach(s => { init[s.subject_id] = true; }); // pre-saved from API
    return init;
  });

  // ── Toast ────────────────────────────────────────────────
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 1800);
  };

  // ── Save one subject ────────────────────────────────────
  const saveSubject = useCallback(async (subject: MarksSubject) => {
    if (!user?.token || !user.record) return;
    const sid = subject.subject_id;
    const obtained = parseInt(marks[sid] ?? '0') || 0;
    if (obtained > subject.max_marks) return; // don't save invalid

    setSavingMap(prev => ({ ...prev, [sid]: true }));
    setSavedMap(prev => ({ ...prev, [sid]: false }));

    try {
      const res = await saveStudentMarksEntry({
        school_id:        user.record.school_id,
        session_id:       (user.record as any).session_id ?? 22,
        class_id:         params.class_id,
        section_id:       params.section_id,
        exam_master_id:   params.exam_master_id,
        student_id:       student.student_id,
        subject_master_id: parseInt(sid),
        marks_obtained:   obtained,
      }, user.token);

      if (res.response_code === 200) {
        setSavedMap(prev => ({ ...prev, [sid]: true }));
        flashToast();
      } else {
        Alert.alert('Save Failed', res.response_message || 'Could not save marks.');
      }
    } catch (e: any) {
      Alert.alert('Network Error', e?.message || 'Check your connection.');
    } finally {
      setSavingMap(prev => ({ ...prev, [sid]: false }));
    }
  }, [user?.token, user?.record, marks, params, student.student_id]);

  // ── Save all at once ─────────────────────────────────────
  const handleSaveAll = async () => {
    Keyboard.dismiss();
    const hasErrors = exam?.subjects.some(s => (parseInt(marks[s.subject_id] ?? '0') || 0) > s.max_marks);
    if (hasErrors) {
      Alert.alert('Invalid Marks', 'Some marks exceed the maximum. Please fix before saving.');
      return;
    }
    if (!exam) return;
    for (const subject of exam.subjects) {
      await saveSubject(subject);
    }
  };

  // ── Live totals ──────────────────────────────────────────
  const totals = useMemo(() => {
    if (!exam) return { obtained: 0, max: 0, pct: '0.0', grade: '—' };
    let obtained = 0, max = 0;
    exam.subjects.forEach(s => {
      obtained += parseInt(marks[s.subject_id] ?? '0') || 0;
      max += s.max_marks;
    });
    const { pct, grade } = calcGrade(obtained, max);
    return { obtained, max, pct, grade };
  }, [marks, exam]);

  const hasErrors = useMemo(() =>
    exam?.subjects.some(s => (parseInt(marks[s.subject_id] ?? '0') || 0) > s.max_marks) ?? false,
    [marks, exam]
  );
  const allSaved = useMemo(() =>
    exam?.subjects.every(s => savedMap[s.subject_id]) ?? false,
    [savedMap, exam]
  );

  const initials = student.student_name?.trim().split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'ST';
  const totalGc = GRADE_STYLE[totals.grade] ?? GRADE_STYLE['—'];
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

        {/* Student info */}
        <View style={styles.studentRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.studentName}>{student.student_name?.trim()}</Text>
            <Text style={styles.studentMeta}>
              #{student.admission_no}
              {student.father_name ? `  ·  👤 ${student.father_name}` : ''}
            </Text>
          </View>
          <View style={styles.examTag}>
            <Text style={styles.examTagTxt}>{params.exam_name}</Text>
          </View>
        </View>

        {/* Live total score */}
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLbl}>Total Score</Text>
            <Text style={styles.totalScore}>
              {totals.obtained}
              <Text style={styles.totalMax}>/{totals.max}</Text>
            </Text>
          </View>
          <View style={{ flex: 1, marginHorizontal: 14 }}>
            <View style={styles.totalBarBg}>
              <View style={[styles.totalBarFill, { width: `${Math.min(totalPct, 100)}%` }]} />
            </View>
            <Text style={styles.totalPct}>{totals.pct}%</Text>
          </View>
          <View style={[styles.gradeBox, { backgroundColor: totalGc.bg }]}>
            <Text style={styles.gradeBoxLbl}>Grade</Text>
            <Text style={[styles.gradeBoxVal, { color: totalGc.color }]}>{totals.grade}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Subject Rows ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: Spacing.lg, gap: 10, paddingBottom: 110 }}
      >
        <Text style={styles.secLbl}>
          Subject-wise Marks  ·  {exam?.subjects.length ?? 0} subjects
        </Text>

        {exam?.subjects.map(subject => (
          <SubjectRow
            key={subject.subject_id}
            subject={subject}
            value={marks[subject.subject_id] ?? ''}
            saving={savingMap[subject.subject_id] ?? false}
            savedOk={savedMap[subject.subject_id] ?? false}
            onChange={v => {
              setSavedMap(prev => ({ ...prev, [subject.subject_id]: false }));
              setMarks(prev => ({ ...prev, [subject.subject_id]: v }));
            }}
            onSave={() => saveSubject(subject)}
          />
        ))}

        {/* Summary card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>📊 Summary</Text>
          <View style={styles.summaryGrid}>
            {[
              { lbl: 'Total Marks', val: `${totals.obtained}/${totals.max}` },
              { lbl: 'Percentage', val: `${totals.pct}%` },
              { lbl: 'Grade', val: totals.grade },
              { lbl: 'Class', val: `${params.class_name}-${params.section_name}` },
            ].map((item, i) => (
              <View key={i} style={styles.summaryItem}>
                <Text style={styles.summaryLbl}>{item.lbl}</Text>
                <Text style={styles.summaryVal}>{item.val}</Text>
              </View>
            ))}
          </View>
          <View style={styles.fullBarBg}>
            <View style={[styles.fullBarFill, { width: `${Math.min(totalPct, 100)}%`, backgroundColor: totalBarColor }]} />
          </View>
        </View>
      </ScrollView>

      {/* ── Save All Button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, hasErrors && styles.saveBtnDisabled]}
          onPress={handleSaveAll}
          disabled={hasErrors}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={hasErrors ? ['#ccc', '#ccc'] : allSaved ? [Colors.green, '#0a8a50'] : [Colors.purple, Colors.purpleDark]}
            style={styles.saveBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          >
            <Text style={styles.saveBtnTxt}>
              {hasErrors ? '⚠ Fix errors before saving' : allSaved ? '✓ All Marks Saved' : 'Save All Marks'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.footerHint}>
          Marks also auto-save when you leave each field
        </Text>
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
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, zIndex: 1 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  avatarTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
  studentName: { fontSize: 16, fontWeight: '800', color: '#fff' },
  studentMeta: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  examTag: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  examTagTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  totalRow: { flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  totalLbl: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' },
  totalScore: { fontSize: 22, fontWeight: '900', color: '#fff', marginTop: 2 },
  totalMax: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  totalBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
  totalBarFill: { height: 6, borderRadius: 3, backgroundColor: '#fff' },
  totalPct: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 4, textAlign: 'right' },
  gradeBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  gradeBoxLbl: { fontSize: 9, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase' },
  gradeBoxVal: { fontSize: 18, fontWeight: '900' },
  secLbl: { fontSize: 11, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  summaryCard: { backgroundColor: Colors.card, borderRadius: Radius.xl, padding: 16, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border },
  summaryTitle: { fontSize: 14, fontWeight: '700', color: Colors.text1, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryItem: { width: '45%' },
  summaryLbl: { fontSize: 10, fontWeight: '600', color: Colors.text3, textTransform: 'uppercase', marginBottom: 2 },
  summaryVal: { fontSize: 16, fontWeight: '800', color: Colors.text1 },
  fullBarBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginTop: 12 },
  fullBarFill: { height: 8, borderRadius: 4 },
  footer: { padding: Spacing.lg, paddingBottom: Spacing.xl, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  saveBtn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  saveBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  footerHint: { fontSize: 11, color: Colors.text3, textAlign: 'center' },
});
