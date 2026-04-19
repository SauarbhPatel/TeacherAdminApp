/**
 * marks-entry.tsx
 *
 * Marks Entry flow — 3-step selector:
 *   Step 1 → Select Class
 *   Step 2 → Select Section
 *   Step 3 → Select Exam
 * Then navigates to student list for that combination.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import {
  MARKS_CLASSES,
  MARKS_SECTIONS,
  MOCK_EXAMS,
} from '@/constants/data';

type Step = 1 | 2 | 3;

interface Selection {
  class_id: string;
  class_name: string;
  section_id: string;
  section_name: string;
  exam_id: string;
  exam_name: string;
}

// ─── Step indicator ──────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'Class' },
    { n: 2, label: 'Section' },
    { n: 3, label: 'Exam' },
  ];
  return (
    <View style={step.row}>
      {steps.map((s, i) => {
        const done = current > s.n;
        const active = current === s.n;
        return (
          <React.Fragment key={s.n}>
            <View style={step.item}>
              <View style={[
                step.circle,
                done && step.circleDone,
                active && step.circleActive,
              ]}>
                <Text style={[step.circleText, (done || active) && step.circleTextActive]}>
                  {done ? '✓' : s.n}
                </Text>
              </View>
              <Text style={[step.label, active && step.labelActive]}>{s.label}</Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[step.line, done && step.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}
const step = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: Spacing.xl, paddingVertical: 16, zIndex: 1 },
  item: { alignItems: 'center', gap: 4 },
  circle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  circleDone: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: 'transparent' },
  circleActive: { backgroundColor: '#fff', borderColor: 'transparent' },
  circleText: { fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.7)' },
  circleTextActive: { color: Colors.purple },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  labelActive: { color: '#fff', fontWeight: '700' },
  line: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 15, marginHorizontal: 4 },
  lineDone: { backgroundColor: 'rgba(255,255,255,0.7)' },
});

// ─── Selection summary pill ───────────────────────────────
function SelectedPill({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <View style={pill.wrap}>
      <Text style={pill.label}>{label}</Text>
      <Text style={pill.value}>{value}</Text>
      <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={pill.x}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}
const pill = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.purpleBg, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.purpleLight + '44',
  },
  label: { fontSize: 10, fontWeight: '600', color: Colors.text3 },
  value: { fontSize: 12, fontWeight: '700', color: Colors.purple },
  x: { fontSize: 10, color: Colors.text3, fontWeight: '700' },
});

// ─── Option card ─────────────────────────────────────────
function OptionCard({
  emoji, title, subtitle, onPress, color,
}: {
  emoji: string; title: string; subtitle?: string;
  onPress: () => void; color?: string;
}) {
  return (
    <TouchableOpacity style={[opt.card, color ? { borderLeftColor: color, borderLeftWidth: 3 } : {}]} onPress={onPress} activeOpacity={0.78}>
      <View style={[opt.iconWrap, { backgroundColor: color ? color + '18' : Colors.purpleBg }]}>
        <Text style={opt.emoji}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={opt.title}>{title}</Text>
        {subtitle ? <Text style={opt.sub}>{subtitle}</Text> : null}
      </View>
      <Text style={opt.chevron}>›</Text>
    </TouchableOpacity>
  );
}
const opt = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    gap: 12, ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 8,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text1 },
  sub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.text3, fontWeight: '300' },
});

// ─── Exam card ───────────────────────────────────────────
const EXAM_COLORS = [Colors.purple, Colors.blue, Colors.green, Colors.amber, Colors.pink, Colors.teal];

// ─── Main Screen ─────────────────────────────────────────
export default function MarksEntryScreen() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>(1);
  const [sel, setSel] = useState<Partial<Selection>>({});

  const sections = sel.class_id ? (MARKS_SECTIONS[sel.class_id] ?? []) : [];

  const resetFrom = (s: Step) => {
    if (s <= 1) setSel({});
    else if (s <= 2) setSel(p => ({ class_id: p.class_id, class_name: p.class_name }));
    else if (s <= 3) setSel(p => ({ class_id: p.class_id, class_name: p.class_name, section_id: p.section_id, section_name: p.section_name }));
    setStep(s);
  };

  // Section count label
  const sectionCount = (cid: string) => {
    const sc = MARKS_SECTIONS[cid]?.length ?? 0;
    return `${sc} section${sc !== 1 ? 's' : ''}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>

      {/* ── Header ── */}
      <LinearGradient colors={[Colors.purple, Colors.purpleDeeper]} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerDecor1} />
        <View style={styles.headerDecor2} />

        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Marks Entry</Text>
            <Text style={styles.headerSub}>Enter student exam scores</Text>
          </View>
        </View>

        {/* Step indicator */}
        <StepBar current={step} />

        {/* Selection breadcrumb pills */}
        {(sel.class_name || sel.section_name || sel.exam_name) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsRow}
          >
            {sel.class_name && (
              <SelectedPill label="Class" value={sel.class_name} onClear={() => resetFrom(1)} />
            )}
            {sel.section_name && (
              <SelectedPill label="Section" value={sel.section_name} onClear={() => resetFrom(2)} />
            )}
            {sel.exam_name && (
              <SelectedPill label="Exam" value={sel.exam_name} onClear={() => resetFrom(3)} />
            )}
          </ScrollView>
        )}
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 40 }}>

        {/* ── Step 1: Select Class ── */}
        {step === 1 && (
          <>
            <Text style={styles.sectionTitle}>Select Class</Text>
            <Text style={styles.sectionSub}>Choose the class to enter marks for</Text>
            {MARKS_CLASSES.map((cls, i) => (
              <OptionCard
                key={cls.class_id}
                emoji="🏫"
                title={`Class ${cls.class_name}`}
                subtitle={sectionCount(cls.class_id)}
                color={EXAM_COLORS[i % EXAM_COLORS.length]}
                onPress={() => {
                  setSel({ class_id: cls.class_id, class_name: cls.class_name });
                  setStep(2);
                }}
              />
            ))}
          </>
        )}

        {/* ── Step 2: Select Section ── */}
        {step === 2 && (
          <>
            <Text style={styles.sectionTitle}>Select Section</Text>
            <Text style={styles.sectionSub}>Class {sel.class_name} — choose a section</Text>
            <View style={styles.sectionGrid}>
              {sections.map((sec, i) => (
                <TouchableOpacity
                  key={sec.section_id}
                  style={[styles.secCard, { backgroundColor: EXAM_COLORS[i % EXAM_COLORS.length] + '14', borderColor: EXAM_COLORS[i % EXAM_COLORS.length] + '44' }]}
                  onPress={() => {
                    setSel(p => ({ ...p, section_id: sec.section_id, section_name: sec.section_name }));
                    setStep(3);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.secLetter, { color: EXAM_COLORS[i % EXAM_COLORS.length] }]}>
                    {sec.section_name}
                  </Text>
                  <Text style={[styles.secLabel, { color: EXAM_COLORS[i % EXAM_COLORS.length] }]}>
                    Section
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Step 3: Select Exam ── */}
        {step === 3 && (
          <>
            <Text style={styles.sectionTitle}>Select Exam</Text>
            <Text style={styles.sectionSub}>Class {sel.class_name}-{sel.section_name} — choose an exam</Text>
            {MOCK_EXAMS.map((exam, i) => (
              <TouchableOpacity
                key={exam.exam_id}
                style={[styles.examCard, { borderLeftColor: EXAM_COLORS[i % EXAM_COLORS.length] }]}
                onPress={() => {
                  router.push({
                    pathname: '/screens/marks-students',
                    params: {
                      class_id: sel.class_id!,
                      class_name: sel.class_name!,
                      section_id: sel.section_id!,
                      section_name: sel.section_name!,
                      exam_id: exam.exam_id,
                      exam_name: exam.exam_name,
                    },
                  });
                }}
                activeOpacity={0.78}
              >
                <View style={[styles.examIconWrap, { backgroundColor: EXAM_COLORS[i % EXAM_COLORS.length] + '18' }]}>
                  <Text style={styles.examIconEmoji}>📝</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.examName}>{exam.exam_name}</Text>
                  <Text style={styles.examSub}>Exam ID: {exam.exam_id}</Text>
                </View>
                <View style={[styles.examBadge, { backgroundColor: EXAM_COLORS[i % EXAM_COLORS.length] + '18' }]}>
                  <Text style={[styles.examBadgeText, { color: EXAM_COLORS[i % EXAM_COLORS.length] }]}>
                    Enter Marks
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md, position: 'relative', overflow: 'hidden' },
  headerDecor1: { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerDecor2: { position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  pillsRow: { gap: 8, paddingBottom: 12, paddingRight: 4 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text1, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: Colors.text3, marginBottom: 16 },

  sectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  secCard: {
    width: '30%', aspectRatio: 1, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, ...Shadow.sm,
  },
  secLetter: { fontSize: 32, fontWeight: '900' },
  secLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  examCard: {
    backgroundColor: Colors.card, borderRadius: Radius.lg,
    padding: 16, flexDirection: 'row', alignItems: 'center',
    gap: 12, marginBottom: 10, ...Shadow.sm,
    borderWidth: 1, borderColor: Colors.border, borderLeftWidth: 4,
  },
  examIconWrap: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  examIconEmoji: { fontSize: 22 },
  examName: { fontSize: 15, fontWeight: '800', color: Colors.text1 },
  examSub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  examBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  examBadgeText: { fontSize: 11, fontWeight: '700' },
});
