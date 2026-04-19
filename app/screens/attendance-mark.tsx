/**
 * attendance-mark.tsx
 *
 * Per-class attendance marking screen.
 * - Loads real student list from GET /get_classwise_attendance
 * - Loads attendance types from GET /get_attendance_type
 * - Saves each student's attendance via POST /save_attendance (optimistic UI)
 * - Supports bulk mark, search, progress tracking
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

// ─────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────

/** Maps API type id → UI colour tokens */
const TYPE_CFG: Record<string, {
  short: string;
  label: string;
  activeBg: string;
  color: string;
  border: string;
}> = {
  '1': { short: 'P', label: 'Present', activeBg: Colors.greenBg,  color: Colors.greenText, border: Colors.green  },
  '3': { short: 'L', label: 'Leave',   activeBg: Colors.amberBg,  color: Colors.amberText, border: Colors.amber  },
  '4': { short: 'A', label: 'Absent',  activeBg: Colors.redBg,    color: Colors.redText,   border: Colors.red    },
  '5': { short: 'H', label: 'Holiday', activeBg: Colors.blueBg,   color: Colors.blueText,  border: Colors.blue   },
};

function cfgFor(id: string | null) {
  return id ? (TYPE_CFG[id] ?? null) : null;
}

// ─────────────────────────────────────────────────────────
// Local student state (extends API record with UI flags)
// ─────────────────────────────────────────────────────────
interface LocalStudent extends ClasswiseStudent {
  /** current working attendance_type_id (may differ from API until saved) */
  local_type_id: string;
  saving: boolean;
  saved: boolean;       // successfully persisted to server
  dirty: boolean;       // changed since last load
}

function buildFullName(s: ClasswiseStudent): string {
  return [s.firstname, s.middlename, s.lastname]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Unknown';
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ─────────────────────────────────────────────────────────
// Save toast
// ─────────────────────────────────────────────────────────
function SaveToast({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
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
    paddingHorizontal: 22, paddingVertical: 10,
    zIndex: 999,
    shadowColor: Colors.green, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  text: { color: '#fff', fontWeight: '800', fontSize: 13, letterSpacing: 0.2 },
});

// ─────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────
export default function AttendanceMarkScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const params = useLocalSearchParams<{
    class_id: string;
    section_id: string;
    class_name: string;
    section_name: string;
    date: string;
  }>();
  const { class_id, section_id, class_name, section_name, date } = params;

  // ── State ───────────────────────────────────────────────
  const [attTypes, setAttTypes]   = useState<AttendanceType[]>([]);
  const [students, setStudents]   = useState<LocalStudent[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ─────────────────────────────────────────────
  const flashToast = useCallback(() => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setShowToast(true);
    toastTimer.current = setTimeout(() => setShowToast(false), 1800);
  }, []);

  // ── Load data ───────────────────────────────────────────
  const loadData = useCallback(async (silent = false) => {
    if (!user?.token || !class_id || !section_id || !date) return;
    if (!silent) { setLoading(true); setLoadError(''); }

    try {
      // Parallel fetch: types + student list
      const [typesRes, classRes] = await Promise.all([
        getAttendanceTypes(user.token,user?.record?.school_id,),
        getClasswiseAttendance(
          { date, class_id: parseInt(class_id), section_id: parseInt(section_id) },
          user.token,user?.record?.school_id,
        ),
      ]);

      if (typesRes.response_code === 200) {
        setAttTypes(typesRes.attendance_types);
      }

      if (classRes.response_code === 200) {
        const mapped: LocalStudent[] = classRes.students.map(s => ({
          ...s,
          local_type_id: s.attendence_type_id ?? '',
          saving: false,
          saved: true,     // data from API is already persisted
          dirty: false,
        }));
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  // ── Save single student ─────────────────────────────────
  const saveOne = useCallback(async (sessionId: string, typeId: string) => {
    if (!user?.token || !date) return;

    // Optimistic: mark saving
    setStudents(prev => prev.map(s =>
      s.student_session_id === sessionId ? { ...s, saving: true } : s
    ));

    try {
      const res = await saveAttendance(
        {
          date,
          student_session_id: parseInt(sessionId),
          attendence_type_id: parseInt(typeId),
        },
        user.token,user?.record?.school_id,
      );

      if (res.response_code === 200) {
        setStudents(prev => prev.map(s =>
          s.student_session_id === sessionId
            ? { ...s, saving: false, saved: true, dirty: false, local_type_id: typeId }
            : s
        ));
        flashToast();
      } else {
        // Revert
        setStudents(prev => prev.map(s =>
          s.student_session_id === sessionId
            ? { ...s, saving: false }
            : s
        ));
        Alert.alert('Save Failed', res.response_message || 'Could not save attendance.');
      }
    } catch (e: any) {
      setStudents(prev => prev.map(s =>
        s.student_session_id === sessionId ? { ...s, saving: false } : s
      ));
      Alert.alert('Network Error', e?.message || 'Check your connection and try again.');
    }
  }, [user?.token, date, flashToast]);

  // ── Toggle type for a student ───────────────────────────
  const markStudent = useCallback((sessionId: string, typeId: string) => {
    setStudents(prev => {
      const student = prev.find(s => s.student_session_id === sessionId);
      if (!student) return prev;
      // Toggle off if same type tapped again
      const newTypeId = student.local_type_id === typeId ? '' : typeId;
      return prev.map(s =>
        s.student_session_id === sessionId
          ? { ...s, local_type_id: newTypeId, saved: false, dirty: true }
          : s
      );
    });

    // Find the resolved new type after state update, then save
    setStudents(prev => {
      const student = prev.find(s => s.student_session_id === sessionId);
      if (student?.local_type_id) {
        saveOne(sessionId, student.local_type_id);
      }
      return prev;
    });
  }, [saveOne]);

  // Simplified toggle: immediate optimistic + save
  const handleTypePress = useCallback((sessionId: string, currentTypeId: string, pressedTypeId: string) => {
    const newTypeId = currentTypeId === pressedTypeId ? '' : pressedTypeId;

    // Optimistic UI update
    setStudents(prev => prev.map(s =>
      s.student_session_id === sessionId
        ? { ...s, local_type_id: newTypeId, saved: false, dirty: true }
        : s
    ));

    // Only save if a type is selected
    if (newTypeId) {
      saveOne(sessionId, newTypeId);
    }
  }, [saveOne]);

  // ── Bulk mark ───────────────────────────────────────────
  const handleBulkMark = useCallback((typeId: string, typeName: string) => {
    Alert.alert(
      `Mark All ${typeName}`,
      `Set all ${students.length} students as "${typeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSubmitting(true);
            // Optimistic update all
            setStudents(prev => prev.map(s => ({
              ...s, local_type_id: typeId, saved: false, dirty: true, saving: true,
            })));

            let ok = 0;
            const current = students;
            for (const s of current) {
              try {
                const res = await saveAttendance(
                  { date: date!, student_session_id: parseInt(s.student_session_id), attendence_type_id: parseInt(typeId) },
                  user!.token
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
                    st.student_session_id === s.student_session_id
                      ? { ...st, saving: false }
                      : st
                  ));
                }
              } catch {
                setStudents(prev => prev.map(st =>
                  st.student_session_id === s.student_session_id
                    ? { ...st, saving: false }
                    : st
                ));
              }
            }
            setSubmitting(false);
            Alert.alert(
              'Bulk Save Complete',
              `Saved ${ok} of ${current.length} students as ${typeName}.`
            );
          },
        },
      ]
    );
  }, [students, date, user]);

  // ── Derived values ──────────────────────────────────────
  const filtered = useMemo(() =>
    students.filter(s =>
      !search ||
      buildFullName(s).toLowerCase().includes(search.toLowerCase()) ||
      s.admission_no.toLowerCase().includes(search.toLowerCase()) ||
      s.roll_no.includes(search)
    ),
    [students, search]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    let unmarked = 0;
    students.forEach(s => {
      if (s.local_type_id) {
        c[s.local_type_id] = (c[s.local_type_id] || 0) + 1;
      } else {
        unmarked++;
      }
    });
    return { ...c, unmarked };
  }, [students]);

  const savedCount  = useMemo(() => students.filter(s => s.saved).length, [students]);
  const dirtyCount  = useMemo(() => students.filter(s => s.dirty).length, [students]);
  const progress    = students.length > 0 ? (savedCount / students.length) * 100 : 0;

  const displayDate = date
    ? new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })
    : '';

  // ── Render ──────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>

      {/* ══ Header ══════════════════════════════════════════ */}
      <LinearGradient
        colors={[Colors.purple, Colors.purpleDeeper]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
      >
        <View style={styles.decorCircle} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerBody}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Class {class_name} – {section_name}
            </Text>
            <Text style={styles.headerSub}>
              {displayDate}  ·  {students.length} student{students.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.refreshIconBtn} onPress={() => { setRefreshing(true); loadData(true); }} activeOpacity={0.75}>
            <Text style={{ fontSize: 18, color: '#fff' }}>↻</Text>
          </TouchableOpacity>
        </View>

        {/* Stat pills row */}
        {!loading && (
          <View style={styles.pillsRow}>
            {attTypes.map(t => {
              const cfg = cfgFor(t.id);
              const count = counts[t.id] || 0;
              return (
                <View key={t.id} style={[styles.pill, { backgroundColor: cfg ? cfg.activeBg + '33' : 'rgba(255,255,255,0.1)' }]}>
                  <Text style={[styles.pillNum, { color: cfg?.color ?? '#fff' }]}>{count}</Text>
                  <Text style={styles.pillLbl}>{t.type}</Text>
                </View>
              );
            })}
            {counts.unmarked > 0 && (
              <View style={[styles.pill, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
                <Text style={[styles.pillNum, { color: 'rgba(255,255,255,0.9)' }]}>{counts.unmarked}</Text>
                <Text style={styles.pillLbl}>Pending</Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>

      {/* ══ Progress bar ════════════════════════════════════ */}
      <View style={styles.progressWrap}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: `${progress}%` as any,
              backgroundColor: progress === 100 ? Colors.green : Colors.purple,
            },
          ]}
        />
      </View>

      {/* ══ Loading / Error ══════════════════════════════════ */}
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
          {/* ══ Controls ══════════════════════════════════════ */}
          <View style={styles.controls}>
            {/* Search bar */}
            <View style={styles.searchBar}>
              <Text style={{ fontSize: 15 }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name, roll no, admission no…"
                placeholderTextColor={Colors.text3}
                returnKeyType="search"
              />
              {search ? (
                <TouchableOpacity
                  onPress={() => setSearch('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={{ color: Colors.text3, fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Bulk action chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bulkRow}
            >
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
                      All {cfg?.short ?? t.type[0]}  ·  {t.type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ══ Student list ════════════════════════════════════ */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.purple}
              />
            }
          >
            {/* Result count */}
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
                const name       = buildFullName(student);
                const initials   = getInitials(name);
                const cfg        = cfgFor(student.local_type_id);
                const leftBorder = cfg?.border ?? Colors.border;
                const avatarBg   = cfg?.activeBg ?? Colors.surface;
                const avatarClr  = cfg?.color ?? Colors.text3;

                return (
                  <View
                    key={student.student_session_id}
                    style={[styles.studentRow, { borderLeftColor: leftBorder }]}
                  >
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                      {student.saving ? (
                        <ActivityIndicator size="small" color={avatarClr} />
                      ) : (
                        <Text style={[styles.avatarText, { color: avatarClr }]}>
                          {initials}
                        </Text>
                      )}
                    </View>

                    {/* Student info */}
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName} numberOfLines={1}>{name}</Text>
                      <View style={styles.studentMeta}>
                        {student.roll_no !== '0' && student.roll_no ? (
                          <Text style={styles.metaChip}>Roll {student.roll_no}</Text>
                        ) : null}
                        {student.admission_no ? (
                          <Text style={styles.metaChip}>#{student.admission_no}</Text>
                        ) : null}
                        {student.father_name ? (
                          <Text style={styles.metaChipGray}>👤 {student.father_name}</Text>
                        ) : null}
                      </View>
                      {student.saved && !student.dirty ? (
                        <Text style={styles.savedLabel}>✓ saved</Text>
                      ) : student.dirty ? (
                        <Text style={styles.dirtyLabel}>● unsaved</Text>
                      ) : null}
                    </View>

                    {/* Attendance type buttons */}
                    <View style={styles.typeBtns}>
                      {attTypes.map(t => {
                        const tc      = cfgFor(t.id);
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
                            onPress={() =>
                              handleTypePress(
                                student.student_session_id,
                                student.local_type_id,
                                t.id
                              )
                            }
                            activeOpacity={0.75}
                            disabled={student.saving || submitting}
                          >
                            <Text
                              style={[
                                styles.typeBtnText,
                                { color: isActive ? tc?.color : Colors.text3 },
                              ]}
                            >
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

          {/* ══ Footer submit ════════════════════════════════════ */}
          <View style={styles.footer}>
            {/* Progress info */}
            <View style={styles.footerInfo}>
              <Text style={styles.footerSaved}>
                {savedCount}/{students.length} saved
              </Text>
              {dirtyCount > 0 && (
                <Text style={styles.footerDirty}>{dirtyCount} pending save</Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
              disabled={submitting}
              activeOpacity={0.88}
              onPress={() => {
                const unmarked = students.filter(s => !s.local_type_id).length;
                if (unmarked > 0) {
                  Alert.alert(
                    'Unmarked Students',
                    `${unmarked} student${unmarked > 1 ? 's are' : ' is'} still unmarked.\nMark them all as Present?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Mark Present & Done',
                        onPress: () => handleBulkMark('1', 'Present'),
                      },
                    ]
                  );
                } else {
                  Alert.alert(
                    '✓ Attendance Complete',
                    `All ${students.length} students have been marked.`,
                    [{ text: 'Done', onPress: () => router.back() }]
                  );
                }
              }}
            >
              <LinearGradient
                colors={savedCount === students.length && students.length > 0
                  ? [Colors.green, '#0a8a50']
                  : [Colors.purple, Colors.purpleDark]}
                style={styles.submitBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {submitting ? (
                  <View style={styles.submitRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.submitText}>Saving…</Text>
                  </View>
                ) : (
                  <Text style={styles.submitText}>
                    {savedCount === students.length && students.length > 0
                      ? `✓ All Done — ${savedCount} Saved`
                      : `Submit Attendance (${savedCount}/${students.length})`}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ══ Toast ═══════════════════════════════════════════ */}
      <SaveToast visible={showToast} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  decorCircle: {
    position: 'absolute', top: -50, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, zIndex: 1,
  },
  backArrow: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerBody: { flexDirection: 'row', alignItems: 'center', zIndex: 1, marginBottom: 14 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  refreshIconBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Stat pills in header
  pillsRow: { flexDirection: 'row', gap: 8, zIndex: 1 },
  pill: {
    flex: 1, borderRadius: 12, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  pillNum: { fontSize: 18, fontWeight: '900' },
  pillLbl: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Progress
  progressWrap: { height: 4, backgroundColor: Colors.border, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },

  // Controls
  controls: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 10,
    ...Shadow.sm,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text1 },
  bulkRow: { gap: 8, paddingBottom: 12, paddingRight: 4 },
  bulkChip: {
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9,
  },
  bulkChipText: { fontSize: 12, fontWeight: '700' },

  // List
  listContent: {
    padding: Spacing.lg,
    paddingTop: 12,
    gap: 8,
    paddingBottom: 100,
  },
  resultCount: {
    fontSize: 12, color: Colors.text3, marginBottom: 6, fontWeight: '600',
  },

  // Student row
  studentRow: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderLeftWidth: 4,
    ...Shadow.sm,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 13, fontWeight: '800' },
  studentInfo: { flex: 1, minWidth: 0 },
  studentName: { fontSize: 13, fontWeight: '700', color: Colors.text1 },
  studentMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 3 },
  metaChip: {
    fontSize: 10, fontWeight: '600', color: Colors.purple,
    backgroundColor: Colors.purpleBg,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
  },
  metaChipGray: {
    fontSize: 10, color: Colors.text3,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  savedLabel: { fontSize: 10, color: Colors.green, fontWeight: '700', marginTop: 3 },
  dirtyLabel: { fontSize: 10, color: Colors.amber, fontWeight: '700', marginTop: 3 },

  // Type buttons
  typeBtns: { flexDirection: 'row', gap: 4, flexShrink: 0 },
  typeBtn: {
    width: 33, height: 33, borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  typeBtnText: { fontSize: 11, fontWeight: '900' },

  // States
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  loadingText: { marginTop: 14, fontSize: 14, color: Colors.text3 },
  errEmoji: { fontSize: 44, marginBottom: 12 },
  errTitle: { fontSize: 16, fontWeight: '700', color: Colors.text1, marginBottom: 6 },
  errMsg: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 16, backgroundColor: Colors.purple,
    borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12,
  },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingTop: 50 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: Colors.text3 },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1, borderTopColor: Colors.border,
    gap: 8,
  },
  footerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerSaved: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  footerDirty: { fontSize: 11, fontWeight: '600', color: Colors.amber },
  submitBtn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  submitBtnGrad: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
});
