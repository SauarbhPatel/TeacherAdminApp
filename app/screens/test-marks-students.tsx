/**
 * test-marks-students.tsx
 *
 * Shows student list for class test.
 * Top: Max Marks input (global for all students, pre-filled from API).
 * Per student: marks_obtained input, auto-save on blur.
 * Search + Sort (name A→Z, Z→A, adm no, roll no) — same pattern.
 * Teal accent throughout.
 */

import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
} from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Animated,
    RefreshControl,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getClassSectionTest, saveStudentTestMarks } from "@/services/api";
import { TestMarkStudent } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

const ACCENT_COLOR = "#0f766e";
const ACCENT_LIGHT = Colors.teal;
const ACCENT_BG = Colors.tealBg;

// ─── Sort ─────────────────────────────────────────────────
type SortKey = "name_asc" | "name_desc" | "adm_asc" | "roll_asc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name_asc", label: "Name A→Z" },
    { key: "name_desc", label: "Name Z→A" },
    { key: "adm_asc", label: "Adm. No." },
    { key: "roll_asc", label: "Roll No." },
];

function buildName(s: TestMarkStudent): string {
    return (
        [s.firstname, s.lastname].filter(Boolean).join(" ").trim() || "Unknown"
    );
}
function getInitials(name: string): string {
    return name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

// ─── Local student ────────────────────────────────────────
interface LocalStudent extends TestMarkStudent {
    localMarks: string;
    saving: boolean;
    saved: boolean;
    dirty: boolean;
}

function sortStudents(list: LocalStudent[], key: SortKey): LocalStudent[] {
    return [...list].sort((a, b) => {
        switch (key) {
            case "name_asc":
                return buildName(a).localeCompare(buildName(b));
            case "name_desc":
                return buildName(b).localeCompare(buildName(a));
            case "adm_asc":
                return a.admission_no.localeCompare(b.admission_no, undefined, {
                    numeric: true,
                });
            case "roll_asc":
                return (
                    parseInt(a.roll_no ?? "9999") -
                    parseInt(b.roll_no ?? "9999")
                );
            default:
                return 0;
        }
    });
}

// ─── Save Toast ───────────────────────────────────────────
function SaveToast({ visible }: { visible: boolean }) {
    const opacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible]);
    return (
        <Animated.View style={[toastS.wrap, { opacity }]} pointerEvents="none">
            <Text style={toastS.txt}>✓ Marks saved</Text>
        </Animated.View>
    );
}
const toastS = StyleSheet.create({
    wrap: {
        position: "absolute",
        bottom: 32,
        alignSelf: "center",
        backgroundColor: ACCENT_LIGHT,
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 8,
        zIndex: 999,
        shadowColor: ACCENT_LIGHT,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    txt: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

// ─── Mini progress bar ────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
    return (
        <View
            style={{
                height: 4,
                backgroundColor: Colors.border,
                borderRadius: 2,
                overflow: "hidden",
                marginTop: 4,
            }}
        >
            <View
                style={{
                    width: `${Math.min(pct, 100)}%`,
                    height: 4,
                    backgroundColor: color,
                    borderRadius: 2,
                }}
            />
        </View>
    );
}

function pctColor(pct: number): string {
    if (pct >= 75) return Colors.green;
    if (pct >= 50) return Colors.amber;
    return Colors.red;
}

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function TestMarksStudentsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const params = useLocalSearchParams<{
        class_id: string;
        class_name: string;
        section_id: string;
        section_name: string;
        subject_master_id: string;
        subject_name: string;
        exam_date: string;
    }>();
    const {
        class_id,
        class_name,
        section_id,
        section_name,
        subject_master_id,
        subject_name,
        exam_date,
    } = params;

    const [students, setStudents] = useState<LocalStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("name_asc");

    // ── Global Max Marks ─────────────────────────────────────
    // Pre-filled from first student that has max_marks, else '0'
    const [maxMarks, setMaxMarks] = useState("0");

    const [showToast, setShowToast] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashToast = useCallback(() => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setShowToast(true);
        toastTimer.current = setTimeout(() => setShowToast(false), 1800);
    }, []);

    // ── Fetch ────────────────────────────────────────────────
    const fetchData = useCallback(
        async (silent = false) => {
            if (!user?.token || !user.record) return;
            if (!silent) {
                setLoading(true);
                setError("");
            }
            try {
                const res = await getClassSectionTest(
                    {
                        school_id: user.record.school_id,
                        session_id: (user.record as any).session_id ?? 22,
                        class_id,
                        section_id,
                        subject_master_id,
                        exam_date,
                    },
                    user.token,
                );
                if (res.response_code === 200) {
                    const list = res.students ?? [];
                    // determine global max_marks from first student that has one
                    const withMax = list.find(
                        (s) => s.max_marks && parseFloat(s.max_marks) > 0,
                    );
                    if (withMax)
                        setMaxMarks(String(parseFloat(withMax.max_marks!)));

                    const mapped: LocalStudent[] = list.map((s) => ({
                        ...s,
                        localMarks: s.marks_obtained
                            ? String(parseFloat(s.marks_obtained))
                            : "",
                        saving: false,
                        saved: !!s.entry_id,
                        dirty: false,
                    }));
                    setStudents(mapped);
                } else {
                    setError(
                        res.response_message || "Failed to load students.",
                    );
                }
            } catch (e: any) {
                setError(e?.message || "Network error.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [
            user?.token,
            user?.record,
            class_id,
            section_id,
            subject_master_id,
            exam_date,
        ],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    // ── Marks change ─────────────────────────────────────────
    const handleChange = useCallback((id: string, val: string) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.student_id === id
                    ? {
                          ...s,
                          localMarks: val.replace(/[^0-9.]/g, ""),
                          dirty: true,
                          saved: false,
                      }
                    : s,
            ),
        );
    }, []);

    // ── Save one ─────────────────────────────────────────────
    const handleSave = useCallback(
        async (student: LocalStudent) => {
            if (!user?.token || !user.record) return;
            const obtained = parseFloat(student.localMarks) || 0;
            const max = parseFloat(maxMarks) || 0;
            if (max > 0 && obtained > max) {
                Alert.alert(
                    "Invalid",
                    `Marks cannot exceed max marks (${max}).`,
                );
                return;
            }
            setStudents((prev) =>
                prev.map((s) =>
                    s.student_id === student.student_id
                        ? { ...s, saving: true }
                        : s,
                ),
            );
            try {
                const res = await saveStudentTestMarks(
                    {
                        school_id: user.record.school_id,
                        session_id: (user.record as any).session_id ?? 22,
                        class_id,
                        section_id,
                        subject_master_id,
                        student_id: student.student_id,
                        marks_obtained: obtained,
                        max_marks: max,
                        exam_date,
                    },
                    user.token,
                );
                if (res.response_code === 200) {
                    setStudents((prev) =>
                        prev.map((s) =>
                            s.student_id === student.student_id
                                ? {
                                      ...s,
                                      saving: false,
                                      saved: true,
                                      dirty: false,
                                  }
                                : s,
                        ),
                    );
                    flashToast();
                } else {
                    setStudents((prev) =>
                        prev.map((s) =>
                            s.student_id === student.student_id
                                ? { ...s, saving: false }
                                : s,
                        ),
                    );
                    Alert.alert(
                        "Save Failed",
                        res.response_message || "Could not save.",
                    );
                }
            } catch (e: any) {
                setStudents((prev) =>
                    prev.map((s) =>
                        s.student_id === student.student_id
                            ? { ...s, saving: false }
                            : s,
                    ),
                );
                Alert.alert(
                    "Network Error",
                    e?.message || "Check your connection.",
                );
            }
        },
        [
            user?.token,
            user?.record,
            class_id,
            section_id,
            subject_master_id,
            exam_date,
            maxMarks,
            flashToast,
        ],
    );

    // ── Filter + Sort ────────────────────────────────────────
    const processed = useMemo(() => {
        const filtered = students.filter(
            (s) =>
                !search ||
                buildName(s).toLowerCase().includes(search.toLowerCase()) ||
                s.admission_no.toLowerCase().includes(search.toLowerCase()) ||
                (s.roll_no ?? "").includes(search),
        );
        return sortStudents(filtered, sortKey);
    }, [students, search, sortKey]);

    // ── Summary ─────────────────────────────────────────────
    const summary = useMemo(() => {
        const saved = students.filter((s) => s.saved && !s.dirty).length;
        const filled = students.filter((s) => s.localMarks !== "").length;
        return { total: students.length, saved, filled };
    }, [students]);

    const maxNum = parseFloat(maxMarks) || 0;

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={{ flex: 1, backgroundColor: Colors.surface }}>
                {/* Header */}
                <LinearGradient
                    colors={[ACCENT_LIGHT, ACCENT_COLOR]}
                    style={[styles.header, { paddingTop: insets.top + 14 }]}
                >
                    <View style={styles.decor1} />
                    <View style={styles.decor2} />
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {class_name}-{section_name} · {subject_name}
                            </Text>
                            <Text style={styles.headerSub}>
                                {loading
                                    ? "Loading…"
                                    : `${summary.total} students · ${exam_date}`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => {
                                setRefreshing(true);
                                fetchData(true);
                            }}
                            activeOpacity={0.75}
                        >
                            <Text style={{ fontSize: 16, color: "#fff" }}>
                                ↻
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {!loading && (
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryPill}>
                                <Text style={styles.sumNum}>
                                    {summary.total}
                                </Text>
                                <Text style={styles.sumLbl}>Total</Text>
                            </View>
                            <View style={styles.summaryPill}>
                                <Text
                                    style={[
                                        styles.sumNum,
                                        { color: "#4ade80" },
                                    ]}
                                >
                                    {summary.saved}
                                </Text>
                                <Text style={styles.sumLbl}>Saved</Text>
                            </View>
                            <View style={styles.summaryPill}>
                                <Text
                                    style={[
                                        styles.sumNum,
                                        { color: "#fbbf24" },
                                    ]}
                                >
                                    {summary.filled}
                                </Text>
                                <Text style={styles.sumLbl}>Filled</Text>
                            </View>
                            <View style={styles.summaryPill}>
                                <Text
                                    style={[
                                        styles.sumNum,
                                        { color: "#fca5a5" },
                                    ]}
                                >
                                    {summary.total - summary.filled}
                                </Text>
                                <Text style={styles.sumLbl}>Pending</Text>
                            </View>
                        </View>
                    )}
                </LinearGradient>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={ACCENT_LIGHT} />
                        <Text style={styles.loadTxt}>Loading students…</Text>
                    </View>
                ) : error ? (
                    <View style={styles.centered}>
                        <Text style={{ fontSize: 36, marginBottom: 12 }}>
                            ⚠️
                        </Text>
                        <Text style={styles.errTitle}>
                            Could not load students
                        </Text>
                        <Text style={styles.errMsg}>{error}</Text>
                        <TouchableOpacity
                            style={[
                                styles.retryBtn,
                                { backgroundColor: ACCENT_LIGHT },
                            ]}
                            onPress={() => fetchData()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryTxt}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* ── Max Marks input (top of list) ── */}
                        <View style={styles.maxMarksBar}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.maxMarksLabel}>
                                    Maximum Marks
                                </Text>
                                <Text style={styles.maxMarksSub}>
                                    Applied to all students in this test
                                </Text>
                            </View>
                            <View style={styles.maxMarksInputWrap}>
                                <TextInput
                                    style={styles.maxMarksInput}
                                    value={maxMarks}
                                    onChangeText={(v) =>
                                        setMaxMarks(v.replace(/[^0-9.]/g, ""))
                                    }
                                    keyboardType="numeric"
                                    selectTextOnFocus
                                    maxLength={6}
                                    placeholder="0"
                                    placeholderTextColor={Colors.text3}
                                />
                            </View>
                        </View>

                        {/* ── Search + Sort ── */}
                        <View style={styles.controlsWrap}>
                            <View style={styles.searchBar}>
                                <Text style={{ fontSize: 15 }}>🔍</Text>
                                <TextInput
                                    style={styles.searchInput}
                                    value={search}
                                    onChangeText={setSearch}
                                    placeholder="Search name, admission, roll…"
                                    placeholderTextColor={Colors.text3}
                                />
                                {search ? (
                                    <TouchableOpacity
                                        onPress={() => setSearch("")}
                                        hitSlop={{
                                            top: 8,
                                            bottom: 8,
                                            left: 8,
                                            right: 8,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                color: Colors.text3,
                                                fontSize: 16,
                                            }}
                                        >
                                            ✕
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                            <View style={styles.sortRow}>
                                <Text style={styles.sortLabel}>Sort by:</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 6 }}
                                >
                                    {SORT_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.key}
                                            style={[
                                                styles.sortChip,
                                                sortKey === opt.key &&
                                                    styles.sortChipActive,
                                            ]}
                                            onPress={() => setSortKey(opt.key)}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.sortChipTxt,
                                                    sortKey === opt.key &&
                                                        styles.sortChipTxtActive,
                                                ]}
                                            >
                                                {sortKey === opt.key
                                                    ? "✓ "
                                                    : ""}
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        </View>

                        {/* ── Student list ── */}
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{
                                padding: Spacing.lg,
                                paddingTop: 10,
                                paddingBottom: 40,
                            }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    tintColor={ACCENT_LIGHT}
                                />
                            }
                        >
                            {search ? (
                                <Text style={styles.resultCount}>
                                    {processed.length} result
                                    {processed.length !== 1 ? "s" : ""}
                                </Text>
                            ) : null}
                            {processed.length === 0 ? (
                                <View style={styles.emptyWrap}>
                                    <Text
                                        style={{
                                            fontSize: 36,
                                            marginBottom: 10,
                                        }}
                                    >
                                        🔍
                                    </Text>
                                    <Text
                                        style={{
                                            color: Colors.text3,
                                            fontSize: 14,
                                        }}
                                    >
                                        No students found
                                    </Text>
                                </View>
                            ) : (
                                processed.map((student) => {
                                    const name = buildName(student);
                                    const initials = getInitials(name);
                                    const obtained =
                                        parseFloat(student.localMarks) || 0;
                                    const pct =
                                        maxNum > 0
                                            ? (obtained / maxNum) * 100
                                            : 0;
                                    const pc = pctColor(pct);
                                    const hasErr =
                                        maxNum > 0 && obtained > maxNum;
                                    const isSaved =
                                        student.saved && !student.dirty;

                                    return (
                                        <View
                                            key={student.student_id}
                                            style={[
                                                styles.studentCard,
                                                isSaved &&
                                                    !hasErr &&
                                                    styles.cardSaved,
                                            ]}
                                        >
                                            <View style={styles.cardTop}>
                                                {/* Avatar */}
                                                <View
                                                    style={[
                                                        styles.avatar,
                                                        {
                                                            backgroundColor:
                                                                isSaved &&
                                                                !hasErr
                                                                    ? ACCENT_BG
                                                                    : student.dirty
                                                                      ? Colors.amberBg
                                                                      : Colors.purpleBg,
                                                        },
                                                    ]}
                                                >
                                                    {student.saving ? (
                                                        <ActivityIndicator
                                                            size="small"
                                                            color={ACCENT_LIGHT}
                                                        />
                                                    ) : (
                                                        <Text
                                                            style={[
                                                                styles.avatarTxt,
                                                                {
                                                                    color:
                                                                        isSaved &&
                                                                        !hasErr
                                                                            ? ACCENT_LIGHT
                                                                            : student.dirty
                                                                              ? Colors.amber
                                                                              : Colors.purple,
                                                                },
                                                            ]}
                                                        >
                                                            {isSaved && !hasErr
                                                                ? "✓"
                                                                : initials}
                                                        </Text>
                                                    )}
                                                </View>

                                                {/* Info */}
                                                <View style={{ flex: 1 }}>
                                                    <Text
                                                        style={
                                                            styles.studentName
                                                        }
                                                        numberOfLines={1}
                                                    >
                                                        {name}
                                                    </Text>
                                                    <View
                                                        style={styles.metaRow}
                                                    >
                                                        <Text
                                                            style={
                                                                styles.metaChip
                                                            }
                                                        >
                                                            #
                                                            {
                                                                student.admission_no
                                                            }
                                                        </Text>
                                                        {student.roll_no ? (
                                                            <Text
                                                                style={
                                                                    styles.metaChip
                                                                }
                                                            >
                                                                Roll{" "}
                                                                {
                                                                    student.roll_no
                                                                }
                                                            </Text>
                                                        ) : null}
                                                        {student.father_name ? (
                                                            <Text
                                                                style={
                                                                    styles.metaGray
                                                                }
                                                            >
                                                                👤{" "}
                                                                {
                                                                    student.father_name
                                                                }
                                                            </Text>
                                                        ) : null}
                                                    </View>
                                                </View>

                                                {/* Marks input */}
                                                <View
                                                    style={{
                                                        alignItems: "center",
                                                        gap: 2,
                                                    }}
                                                >
                                                    <View
                                                        style={[
                                                            styles.marksInputWrap,
                                                            hasErr &&
                                                                styles.marksInputErr,
                                                            isSaved &&
                                                                !hasErr && {
                                                                    borderColor:
                                                                        ACCENT_LIGHT,
                                                                },
                                                        ]}
                                                    >
                                                        <TextInput
                                                            style={[
                                                                styles.marksInput,
                                                                {
                                                                    color: hasErr
                                                                        ? Colors.red
                                                                        : Colors.text1,
                                                                },
                                                            ]}
                                                            value={
                                                                student.localMarks
                                                            }
                                                            onChangeText={(v) =>
                                                                handleChange(
                                                                    student.student_id,
                                                                    v,
                                                                )
                                                            }
                                                            onBlur={() => {
                                                                if (
                                                                    !hasErr &&
                                                                    student.localMarks !==
                                                                        ""
                                                                )
                                                                    handleSave(
                                                                        student,
                                                                    );
                                                            }}
                                                            keyboardType="numeric"
                                                            maxLength={6}
                                                            selectTextOnFocus
                                                            placeholder="—"
                                                            placeholderTextColor={
                                                                Colors.text3
                                                            }
                                                            editable={
                                                                !student.saving
                                                            }
                                                            textAlign="center"
                                                        />
                                                    </View>
                                                    <Text
                                                        style={[
                                                            styles.maxLabel,
                                                            {
                                                                color: hasErr
                                                                    ? Colors.red
                                                                    : Colors.text3,
                                                            },
                                                        ]}
                                                    >
                                                        {hasErr
                                                            ? `Max ${maxNum}`
                                                            : `/ ${maxNum || "?"}`}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Pct bar */}
                                            {student.localMarks !== "" &&
                                                maxNum > 0 &&
                                                !hasErr && (
                                                    <View
                                                        style={{
                                                            paddingHorizontal: 2,
                                                            marginTop: 4,
                                                        }}
                                                    >
                                                        <View
                                                            style={
                                                                styles.pctRow
                                                            }
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.pctTxt,
                                                                    {
                                                                        color: pc,
                                                                    },
                                                                ]}
                                                            >
                                                                {pct.toFixed(1)}
                                                                %
                                                            </Text>
                                                        </View>
                                                        <Bar
                                                            pct={pct}
                                                            color={pc}
                                                        />
                                                    </View>
                                                )}

                                            {hasErr && (
                                                <Text style={styles.errMsg}>
                                                    ⚠ Marks exceed maximum (
                                                    {maxNum})
                                                </Text>
                                            )}
                                        </View>
                                    );
                                })
                            )}
                        </ScrollView>
                    </>
                )}

                <SaveToast visible={showToast} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        position: "relative",
        overflow: "hidden",
    },
    decor1: {
        position: "absolute",
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    decor2: {
        position: "absolute",
        bottom: -50,
        left: 10,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
        zIndex: 1,
    },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    backArrow: { color: "#fff", fontSize: 18, fontWeight: "700" },
    headerTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },
    summaryRow: { flexDirection: "row", gap: 8, zIndex: 1 },
    summaryPill: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.14)",
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
    },
    sumNum: { fontSize: 15, fontWeight: "900", color: "#fff" },
    sumLbl: {
        fontSize: 9,
        fontWeight: "600",
        color: "rgba(255,255,255,0.65)",
        marginTop: 2,
    },
    // Max marks bar
    maxMarksBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: ACCENT_BG,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: ACCENT_LIGHT + "30",
    },
    maxMarksLabel: { fontSize: 13, fontWeight: "800", color: ACCENT_COLOR },
    maxMarksSub: { fontSize: 10, color: Colors.text3, marginTop: 2 },
    maxMarksInputWrap: {
        backgroundColor: Colors.white,
        borderRadius: Radius.md,
        borderWidth: 2,
        borderColor: ACCENT_LIGHT,
        paddingHorizontal: 4,
    },
    maxMarksInput: {
        fontSize: 20,
        fontWeight: "900",
        color: ACCENT_COLOR,
        textAlign: "center",
        width: 72,
        paddingVertical: 8,
    },
    // Controls
    controlsWrap: {
        backgroundColor: Colors.surface,
        paddingHorizontal: Spacing.lg,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: Colors.card,
        borderRadius: Radius.md,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.sm,
        marginBottom: 8,
        paddingVertical: 3,
    },
    searchInput: { flex: 1, fontSize: 14, color: Colors.text1 },
    sortRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingBottom: 10,
    },
    sortLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.text3,
        flexShrink: 0,
    },
    sortChip: {
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sortChipActive: {
        backgroundColor: ACCENT_LIGHT,
        borderColor: ACCENT_LIGHT,
    },
    sortChipTxt: { fontSize: 11, fontWeight: "600", color: Colors.text2 },
    sortChipTxtActive: { color: "#fff" },
    // States
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    loadTxt: { marginTop: 12, fontSize: 14, color: Colors.text3 },
    errTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text1,
        marginBottom: 6,
    },
    errMsg2: {
        fontSize: 13,
        color: Colors.text3,
        textAlign: "center",
        lineHeight: 20,
    },
    retryBtn: {
        marginTop: 16,
        borderRadius: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
    resultCount: {
        fontSize: 12,
        color: Colors.text3,
        fontWeight: "600",
        marginBottom: 4,
    },
    emptyWrap: { alignItems: "center", paddingTop: 60 },
    errMsg: {
        fontSize: 11,
        color: Colors.red,
        fontWeight: "600",
        marginTop: 6,
    },
    // Student cards
    studentCard: {
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        ...Shadow.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: 10,
        padding: Spacing.lg,
    },
    cardSaved: { borderColor: ACCENT_BG },
    cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    avatarTxt: { fontSize: 14, fontWeight: "800" },
    studentName: { fontSize: 14, fontWeight: "700", color: Colors.text1 },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 3,
        flexWrap: "wrap",
    },
    metaChip: {
        fontSize: 10,
        fontWeight: "600",
        color: Colors.purple,
        backgroundColor: Colors.purpleBg,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    metaGray: { fontSize: 10, color: Colors.text3 },
    marksInputWrap: {
        width: 60,
        height: 44,
        borderRadius: Radius.md,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    marksInputErr: { borderColor: Colors.red, backgroundColor: Colors.redBg },
    marksInput: {
        fontSize: 18,
        fontWeight: "900",
        width: "100%",
        textAlign: "center",
        padding: 0,
    },
    maxLabel: { fontSize: 9, fontWeight: "600" },
    pctRow: { flexDirection: "row", justifyContent: "flex-end" },
    pctTxt: { fontSize: 10, fontWeight: "700" },
});
