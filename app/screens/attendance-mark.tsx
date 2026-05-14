
/**
 * attendance-mark.tsx
 *
 * Per-class attendance marking screen.
 * - All students default to Present on load (unsaved)
 * - Teacher taps to change type — NO auto-save on each tap
 * - "All Done" button saves all unsaved students with their current type
 * - Bulk mark chips (All P / All A / All L) still available for quick marking
 */

import React, {
  useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Alert, Animated, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import {
  getAttendanceTypes,
  getClasswiseAttendance,
  saveAttendance,
} from '@/services/api';
import { AttendanceType, ClasswiseStudent } from '@/types';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';

// ─── TYPE CONFIG ──────────────────────────────────────────
const TYPE_CFG: Record<string, {
  short: string; label: string; activeBg: string; color: string; border: string;
}> = {
  '1': { short: 'P', label: 'Present', activeBg: Colors.greenBg,  color: Colors.greenText, border: Colors.green  },
  '3': { short: 'L', label: 'Leave',   activeBg: Colors.amberBg,  color: Colors.amberText, border: Colors.amber  },
  '4': { short: 'A', label: 'Absent',  activeBg: Colors.redBg,    color: Colors.redText,   border: Colors.red    },
  '5': { short: 'H', label: 'Holiday', activeBg: Colors.blueBg,   color: Colors.blueText,  border: Colors.blue   },
};
function cfgFor(id: string | null | undefined) {
  return id ? (TYPE_CFG[id] ?? null) : null;
}

// ─── LOCAL STUDENT TYPE ───────────────────────────────────
interface LocalStudent extends ClasswiseStudent {
  local_type_id: string; // '1' Present by default
  saving: boolean;
  saved: boolean;   // persisted to server
  dirty: boolean;   // changed since load / not yet saved
}

function buildFullName(s: ClasswiseStudent): string {
  return [s.firstname, s.middlename, s.lastname].filter(Boolean).join(' ').trim() || 'Unknown';
}
function getInitials(name: string): string {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─── SAVE TOAST ───────────────────────────────────────────
function SaveToast({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [visible]);
  return (
    <Animated.View style={[toastS.wrap, { opacity }]} pointerEvents="none">
      <Text style={toastS.text}>✓  Attendance saved</Text>
    </Animated.View>
  );
}
const toastS = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    backgroundColor: Colors.green, borderRadius: 24,
    paddingHorizontal: 22, paddingVertical: 10, zIndex: 999,
    shadowColor: Colors.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 13 },
});

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function AttendanceMarkScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    class_id: string; section_id: string;
    class_name: string; section_name: string; date: string;
  }>();
  const { class_id, section_id, class_name, section_name, date ,} = params;

  const [attTypes, setAttTypes] = useState<AttendanceType[]>([]);
  const [students, setStudents] = useState<LocalStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 1800);
  }, []);

  // ── Load data ─────────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!user?.token || !class_id || !section_id || !date) return;
    if (!silent) { setLoading(true); setLoadError(''); }
    try {
      const [typesRes, classRes] = await Promise.all([
        getAttendanceTypes(user.token, user?.record?.school_id),
        getClasswiseAttendance(
          { date, class_id: parseInt(class_id), section_id: parseInt(section_id) },
          user.token, user?.record?.school_id,
        ),
      ]);

      if (typesRes.response_code === 200) {
        setAttTypes(typesRes.attendance_types);
      }

      if (classRes.response_code === 200) {
        const mapped: LocalStudent[] = classRes.students.map(s => {
          const existingType = s.attendence_type_id ? String(s.attendence_type_id) : null;
          return {
            ...s,
            // Default to Present ('1') if no existing attendance from API
            local_type_id: existingType ?? '1',
            saving: false,
            // Already saved if API returned an existing type for them
            saved: !!existingType,
            // Dirty (unsaved) if we defaulted them to Present
            dirty: !existingType,
          };
        });
        setStudents(mapped);
      } else {
        setLoadError(classRes.response_message || 'Failed to fetch students.');
      }
    } catch (e: any) {
      setLoadError(e?.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, class_id, section_id, date]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(true); }, [loadData]);

  // ── Type press — UI only, NO auto-save ───────────────────
  const handleTypePress = useCallback((sessionId: string, currentTypeId: string, pressedTypeId: string) => {
    // Toggle same → revert to Present (default), never empty
    const newTypeId = currentTypeId === pressedTypeId ? '1' : pressedTypeId;
    setStudents(prev => prev.map(s =>
      s.student_session_id === sessionId
        ? { ...s, local_type_id: newTypeId, saved: false, dirty: true }
        : s
    ));
  }, []);

  // ── Save all unsaved students (used by All Done + bulk chips) ─
  const saveStudents = useCallback(async (targets: LocalStudent[]) => {
    if (!user?.token || !date || targets.length === 0) return 0;
    setSubmitting(true);

    // Optimistic: mark all targets as saving
    setStudents(prev => prev.map(s =>
      targets.some(t => t.student_session_id === s.student_session_id)
        ? { ...s, saving: true }
        : s
    ));

    let ok = 0;
    for (const s of targets) {
      try {
        const res = await saveAttendance(
          {
            date,
            student_session_id: parseInt(s.student_session_id),
            attendence_type_id: parseInt(s.local_type_id || '1'),
          },
          user.token,
          user?.record?.school_id,
        );
        if (res.response_code === 200) {
          ok++;
          setStudents(prev => prev.map(st =>
            st.student_session_id === s.student_session_id
              ? { ...st, saving: false, saved: true, dirty: false }
              : st
          ));
        } else {
          setStudents(prev => prev.map(st =>
            st.student_session_id === s.student_session_id ? { ...st, saving: false } : st
          ));
        }
      } catch {
        setStudents(prev => prev.map(st =>
          st.student_session_id === s.student_session_id ? { ...st, saving: false } : st
        ));
      }
    }
    setSubmitting(false);
    return ok;
  }, [user?.token, date, user?.record?.school_id]);

  // ── Bulk mark chip (All P / All A etc.) ──────────────────
  const handleBulkMark = useCallback((typeId: string, typeName: string) => {
    Alert.alert(
      `Mark All ${typeName}`,
      `Set all ${students.length} students as "${typeName}" and save?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            // Update all to the new type first
            const updated = students.map(s => ({ ...s, local_type_id: typeId, saved: false, dirty: true }));
            setStudents(updated);
            const ok = await saveStudents(updated);
            if (ok > 0) {
              flashToast();
              if (ok === students.length) {
                Alert.alert('✓ Done', `All ${students.length} students marked as ${typeName}.`, [
                  { text: 'Done', onPress: () => router.back() },
                ]);
              } else {
                Alert.alert('Partial Save', `Saved ${ok} of ${students.length} students.`);
              }
            }
          },
        },
      ]
    );
  }, [students, saveStudents, flashToast]);

  // ── All Done button ───────────────────────────────────────
  const handleAllDone = useCallback(() => {
    const unsaved = students.filter(s => !s.saved);

    if (unsaved.length === 0) {
      // Everything already saved
      Alert.alert('✓ All Done', `All ${students.length} students are saved.`, [
        { text: 'Done', onPress: () => router.back() },
      ]);
      return;
    }

    // Build breakdown: how many Present vs other among unsaved
    const byType: Record<string, number> = {};
    unsaved.forEach(s => {
      const typeId = s.local_type_id || '1';
      byType[typeId] = (byType[typeId] || 0) + 1;
    });

    const lines = Object.entries(byType).map(([tid, count]) => {
      const cfg = cfgFor(tid);
      return `• ${count} as ${cfg?.label ?? 'Present'}`;
    });

    Alert.alert(
      `${unsaved.length} Unsaved Student${unsaved.length !== 1 ? 's' : ''}`,
      `The following will be saved:\n${lines.join('\n')}\n\nProceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Save ${unsaved.length} Students`,
          onPress: async () => {
            const ok = await saveStudents(unsaved);
            if (ok === unsaved.length) {
              flashToast();
              Alert.alert('✓ Attendance Saved', `Saved all ${students.length} students.`, [
                { text: 'Done', onPress: () => router.back() },
              ]);
            } else {
              Alert.alert('Partial Save', `Saved ${ok} of ${unsaved.length}. Please retry.`);
            }
          },
        },
      ]
    );
  }, [students, saveStudents, flashToast]);

  // ── Derived ───────────────────────────────────────────────
  const filtered = useMemo(() =>
    students.filter(s =>
      !search ||
      buildFullName(s).toLowerCase().includes(search.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_no ?? '').includes(search)
    ),
    [students, search]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    students.forEach(s => {
      const tid = s.local_type_id || '1';
      c[tid] = (c[tid] || 0) + 1;
    });
    return c;
  }, [students]);

  const savedCount = useMemo(() => students.filter(s => s.saved).length, [students]);
  const unsavedCount = students.length - savedCount;
  const progress = students.length > 0 ? (savedCount / students.length) * 100 : 0;

  const displayDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : '';

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>

      {/* ── Header ── */}
      <LinearGradient
        colors={[Colors.purple, Colors.purpleDeeper]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.decorCircle} />

        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Class {class_name} – {section_name}</Text>
            <Text style={styles.headerSub}>
              {displayDate} · {students.length} student{students.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.backBtn} onPress={() => { setRefreshing(true); loadData(true); }} activeOpacity={0.75}>
            <Text style={{ fontSize: 18, color: '#fff' }}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Stat pills */}
        {!loading && (
          <View style={styles.pillsRow}>
            {attTypes.map(t => {
              const cfg = cfgFor(t.id);
              const count = counts[t.id] || 0;
              return (
                <View key={t.id} style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                  <Text style={[styles.pillNum, { color: cfg?.color ?? '#fff' }]}>{count}</Text>
                  <Text style={styles.pillLbl}>{cfg?.label ?? t.type}</Text>
                </View>
              );
            })}
            <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Text style={[styles.pillNum, { color: savedCount === students.length ? '#4ade80' : '#fbbf24' }]}>
                {savedCount}/{students.length}
              </Text>
              <Text style={styles.pillLbl}>Saved</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* ── Progress bar ── */}
      <View style={styles.progressWrap}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${progress}%` as any,
              backgroundColor: progress === 100 ? Colors.green : Colors.purple,
            },
          ]}
        />
      </View>

      {/* ── Body ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.purple} />
          <Text style={styles.loadingText}>Fetching student list…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.centered}>
          <Text style={styles.errEmoji}>⚠️</Text>
          <Text style={styles.errTitle}>Could not load students</Text>
          <Text style={styles.errMsg}>{loadError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadData()} activeOpacity={0.8}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Controls */}
          <View style={styles.controls}>
            {/* Search */}
            <View style={styles.searchBar}>
              <Text style={{ fontSize: 15 }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search name, roll no, admission no…"
                placeholderTextColor={Colors.text3}
              />
              {search ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ color: Colors.text3, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Bulk mark chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bulkRow}>
              {attTypes.map(t => {
                const cfg = cfgFor(t.id);
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.bulkChip, { backgroundColor: cfg?.activeBg ?? Colors.surface }]}
                    onPress={() => handleBulkMark(t.id, t.type)}
                    activeOpacity={0.8}
                    disabled={submitting}
                  >
                    <Text style={[styles.bulkChipText, { color: cfg?.color ?? Colors.text2 }]}>
                      All {cfg?.short} · {t.type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Student list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.purple} />}
          >
            {search ? (
              <Text style={styles.resultCount}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
              </Text>
            ) : null}

            {filtered.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>No students match your search.</Text>
              </View>
            ) : (
              filtered.map((student, idx) => {
                const name = buildFullName(student);
                const initials = getInitials(name);
                const cfg = cfgFor(student.local_type_id);
                const isDefaultPresent = student.local_type_id === '1';

                return (
                  <View
                    key={student.student_session_id}
                    style={[
                      styles.studentRow,
                      idx % 2 === 1 && styles.studentRowAlt,
                      { borderLeftColor: cfg?.border ?? Colors.border },
                    ]}
                  >
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: cfg?.activeBg ?? Colors.surface }]}>
                      {student.saving ? (
                        <ActivityIndicator size="small" color={Colors.purple} />
                      ) : (
                        <Text style={[styles.avatarText, { color: cfg?.color ?? Colors.text3 }]}>
                          {student.saved ? cfg?.short ?? initials : initials}
                        </Text>
                      )}
                    </View>

                    {/* Name + meta */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.studentName} numberOfLines={1}>{name}</Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaChip}>#{student.admission_no}</Text>
                        {student.roll_no ? <Text style={styles.metaChip}>Roll {student.roll_no}</Text> : null}
                        {student.father_name ? <Text style={styles.metaGray}>👤 {student.father_name}</Text> : null}
                      </View>
                      {/* Saved / unsaved indicator */}
                      {student.saved ? (
                        <Text style={styles.savedLabel}>✓ saved</Text>
                      ) : (
                        <Text style={styles.dirtyLabel}>● not saved yet</Text>
                      )}
                    </View>

                    {/* Type buttons */}
                    <View style={styles.typeBtns}>
                      {attTypes.map(t => {
                        const tc = cfgFor(t.id);
                        const isActive = student.local_type_id === t.id;
                        return (
                          <TouchableOpacity
                            key={t.id}
                            style={[
                              styles.typeBtn,
                              isActive
                                ? { backgroundColor: tc?.activeBg, borderColor: tc?.border }
                                : { backgroundColor: Colors.surface, borderColor: Colors.border },
                            ]}
                            onPress={() => handleTypePress(student.student_session_id, student.local_type_id, t.id)}
                            activeOpacity={0.75}
                            disabled={student.saving || submitting}
                          >
                            <Text style={[styles.typeBtnText, { color: isActive ? tc?.color : Colors.text3 }]}>
                              {tc?.short ?? t.type[0]}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ height: 20 }} />
          </ScrollView>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.footerInfo}>
              <Text style={styles.footerSaved}>{savedCount}/{students.length} saved</Text>
              {unsavedCount > 0 ? (
                <Text style={styles.footerDirty}>{unsavedCount} unsaved — tap All Done</Text>
              ) : (
                <Text style={styles.footerComplete}>✓ All saved</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              disabled={submitting}
              activeOpacity={0.88}
              onPress={handleAllDone}
            >
              <LinearGradient
                colors={savedCount === students.length && students.length > 0
                  ? [Colors.green, '#0a8a50']
                  : [Colors.purple, Colors.purpleDeeper]}
                style={styles.submitBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <View style={styles.submitRow}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitText}>Saving…</Text>
                  </View>
                ) : (
                  <Text style={styles.submitText}>
                    {savedCount === students.length && students.length > 0
                      ? '✓ All Done'
                      : `All Done · Save ${unsavedCount} Student${unsavedCount !== 1 ? 's' : ''}`}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      <SaveToast visible={showToast} />
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: { paddingHorizontal: Spacing.xl, paddingBottom: 10, position: 'relative', overflow: 'hidden' },
  decorCircle: { position: 'absolute', top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  backArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Pills
  pillsRow: { flexDirection: 'row', gap: 6, paddingBottom: 10 },
  pill: { flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center' },
  pillNum: { fontSize: 16, fontWeight: '900', color: '#fff' },
  pillLbl: { fontSize: 8, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginTop: 2 },

  // Progress
  progressWrap: { height: 4, backgroundColor: Colors.border },
  progressFill: { height: 4, borderRadius: 0 },

  // Controls
  controls: { backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.lg, paddingTop: 10, paddingBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text1 },
  bulkRow: { gap: 8, paddingBottom: 2 },
  bulkChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 0 },
  bulkChipText: { fontSize: 11, fontWeight: '700' },

  // Student rows
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: 6 },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingRight: 6,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    borderLeftWidth: 3, paddingLeft: 10,
  },
  studentRowAlt: { backgroundColor: Colors.surface + '88' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 13, fontWeight: '800' },
  studentName: { fontSize: 13, fontWeight: '700', color: Colors.text1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2, flexWrap: 'wrap' },
  metaChip: { fontSize: 9, fontWeight: '600', color: Colors.purple, backgroundColor: Colors.purpleBg, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  metaGray: { fontSize: 9, color: Colors.text3 },
  savedLabel: { fontSize: 9, color: Colors.green, fontWeight: '700', marginTop: 2 },
  dirtyLabel: { fontSize: 9, color: Colors.amber, fontWeight: '700', marginTop: 2 },

  // Type buttons
  typeBtns: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  typeBtn: { width: 33, height: 33, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  typeBtnText: { fontSize: 11, fontWeight: '900' },

  // States
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 14, fontSize: 14, color: Colors.text3 },
  errEmoji: { fontSize: 44, marginBottom: 12 },
  errTitle: { fontSize: 16, fontWeight: '700', color: Colors.text1, marginBottom: 6 },
  errMsg: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 16, backgroundColor: Colors.purple, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingTop: 50 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.text3 },
  resultCount: { fontSize: 12, color: Colors.text3, fontWeight: '600', marginBottom: 6 },

  // Footer
  footer: { paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border, gap: 8 },
  footerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerSaved: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  footerDirty: { fontSize: 11, fontWeight: '600', color: Colors.amber },
  footerComplete: { fontSize: 11, fontWeight: '700', color: Colors.green },
  submitBtn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  submitBtnGrad: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});