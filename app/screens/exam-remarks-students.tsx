/**
 * exam-remarks-students.tsx
 *
 * Per-student exam remarks editor.
 * Single text field per student — remark.
 * Auto-saves on blur. Optimistic UI. SaveToast.
 * Search + Sort (name A-Z, Z-A, adm no, roll no).
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
import { getStudentExamRemarks, saveExamRemarks } from "@/services/api";
import { ExamRemarksStudent } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

// ─── Sort options (+ Roll No) ─────────────────────────────
type SortKey = "name_asc" | "name_desc" | "adm_asc" | "roll_asc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name_asc", label: "Name A→Z" },
    { key: "name_desc", label: "Name Z→A" },
    { key: "adm_asc", label: "Adm. No." },
    { key: "roll_asc", label: "Roll No." },
];

function buildFullName(s: ExamRemarksStudent): string {
    return (
        [s.firstname, s.middlename, s.lastname]
            .filter(Boolean)
            .join(" ")
            .trim() || "Unknown"
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

// ─── Local student type ───────────────────────────────────
interface LocalStudent extends ExamRemarksStudent {
    localRemark: string;
    saving: boolean;
    saved: boolean;
    dirty: boolean;
}

function sortStudents(list: LocalStudent[], key: SortKey): LocalStudent[] {
    return [...list].sort((a, b) => {
        switch (key) {
            case "name_asc":
                return buildFullName(a).localeCompare(buildFullName(b));
            case "name_desc":
                return buildFullName(b).localeCompare(buildFullName(a));
            case "adm_asc":
                return a.admission_no.localeCompare(b.admission_no, undefined, {
                    numeric: true,
                });
            case "roll_asc": {
                const ra = parseInt(a.roll_no ?? "9999");
                const rb = parseInt(b.roll_no ?? "9999");
                return ra - rb;
            }
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
            <Text style={toastS.txt}>✓ Remark saved</Text>
        </Animated.View>
    );
}
const toastS = StyleSheet.create({
    wrap: {
        position: "absolute",
        bottom: 32,
        alignSelf: "center",
        backgroundColor: Colors.amber,
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 8,
        zIndex: 999,
        shadowColor: Colors.amber,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    txt: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

// ─── Student Card ─────────────────────────────────────────
function StudentCard({
    student,
    onChange,
    onSave,
}: {
    student: LocalStudent;
    onChange: (id: string, val: string) => void;
    onSave: (student: LocalStudent) => void;
}) {
    const name = buildFullName(student);
    const initials = getInitials(name);
    const hasFilled = student.localRemark.trim().length > 0;

    return (
        <View
            style={[sc.card, student.saved && !student.dirty && sc.cardSaved]}
        >
            {/* Top row */}
            <View style={sc.topRow}>
                <View
                    style={[
                        sc.avatar,
                        {
                            backgroundColor:
                                student.saved && !student.dirty
                                    ? Colors.amberBg
                                    : student.dirty
                                      ? Colors.purpleBg
                                      : Colors.surface,
                        },
                    ]}
                >
                    {student.saving ? (
                        <ActivityIndicator size="small" color={Colors.amber} />
                    ) : (
                        <Text
                            style={[
                                sc.avatarTxt,
                                {
                                    color:
                                        student.saved && !student.dirty
                                            ? Colors.amber
                                            : student.dirty
                                              ? Colors.purple
                                              : Colors.text3,
                                },
                            ]}
                        >
                            {student.saved && !student.dirty ? "✓" : initials}
                        </Text>
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={sc.name} numberOfLines={1}>
                        {name}
                    </Text>
                    <View style={sc.metaRow}>
                        <Text style={sc.metaChip}>#{student.admission_no}</Text>
                        {student.roll_no ? (
                            <Text style={sc.metaChip}>
                                Roll {student.roll_no}
                            </Text>
                        ) : null}
                    </View>
                </View>
                {/* Status badge */}
                <View
                    style={[
                        sc.statusBadge,
                        {
                            backgroundColor:
                                student.saved && !student.dirty && hasFilled
                                    ? Colors.amberBg
                                    : Colors.surface,
                        },
                    ]}
                >
                    <Text
                        style={[
                            sc.statusTxt,
                            {
                                color:
                                    student.saved && !student.dirty && hasFilled
                                        ? Colors.amberText
                                        : Colors.text3,
                            },
                        ]}
                    >
                        {student.saved && !student.dirty && hasFilled
                            ? "Saved"
                            : hasFilled
                              ? "Unsaved"
                              : "Empty"}
                    </Text>
                </View>
            </View>

            {/* Exam name sub-label */}
            <Text style={sc.examLbl}>{student.remarks.exam_name}</Text>

            {/* Remark input */}
            <TextInput
                style={[sc.remarkInput, student.dirty && sc.remarkInputDirty]}
                value={student.localRemark}
                onChangeText={(v) => onChange(student.student_id, v)}
                onBlur={() => onSave(student)}
                placeholder="Type remark here…"
                placeholderTextColor={Colors.text3}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
            />

            {student.dirty && !student.saving && (
                <Text style={sc.dirtyLbl}>
                    ● unsaved changes — will save on blur
                </Text>
            )}
        </View>
    );
}

const sc = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        ...Shadow.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: 10,
        padding: Spacing.lg,
    },
    cardSaved: { borderColor: Colors.amberBg },
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    avatarTxt: { fontSize: 14, fontWeight: "800" },
    name: { fontSize: 14, fontWeight: "700", color: Colors.text1 },
    metaRow: { flexDirection: "row", gap: 6, marginTop: 3 },
    metaChip: {
        fontSize: 10,
        fontWeight: "600",
        color: Colors.purple,
        backgroundColor: Colors.purpleBg,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 5,
    },
    statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    statusTxt: { fontSize: 10, fontWeight: "800" },
    examLbl: {
        fontSize: 11,
        color: Colors.text3,
        fontWeight: "600",
        marginBottom: 8,
    },
    remarkInput: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: 12,
        fontSize: 13,
        color: Colors.text1,
        minHeight: 70,
    },
    remarkInputDirty: { borderColor: Colors.purple },
    dirtyLbl: {
        fontSize: 10,
        color: Colors.amber,
        fontWeight: "700",
        marginTop: 6,
    },
});

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function ExamRemarksStudentsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const params = useLocalSearchParams<{
        class_id: string;
        class_name: string;
        section_id: string;
        section_name: string;
        exam_id: string;
        exam_name: string;
    }>();
    const {
        class_id,
        class_name,
        section_id,
        section_name,
        exam_id,
        exam_name,
    } = params;

    const [students, setStudents] = useState<LocalStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("name_asc");

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
                const res = await getStudentExamRemarks(
                    {
                        school_id: user.record.school_id,
                        session_id: (user.record as any).session_id ?? 22,
                        class_id,
                        section_id,
                        exam_id,
                    },
                    user.token,
                );
                if (res.response_code === 200) {
                    const mapped: LocalStudent[] = (res.students ?? []).map(
                        (s) => ({
                            ...s,
                            localRemark: s.remarks.remarks ?? "",
                            saving: false,
                            saved: true,
                            dirty: false,
                        }),
                    );
                    setStudents(mapped);
                } else {
                    setError(res.response_message || "Failed to load.");
                }
            } catch (e: any) {
                setError(e?.message || "Network error.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [user?.token, user?.record, class_id, section_id, exam_id],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    // ── Remark change ────────────────────────────────────────
    const handleChange = useCallback((id: string, val: string) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.student_id === id
                    ? { ...s, localRemark: val, dirty: true, saved: false }
                    : s,
            ),
        );
    }, []);

    // ── Save ─────────────────────────────────────────────────
    const handleSave = useCallback(
        async (student: LocalStudent) => {
            if (!user?.token || !user.record) return;
            if (!student.dirty) return; // nothing changed
            setStudents((prev) =>
                prev.map((s) =>
                    s.student_id === student.student_id
                        ? { ...s, saving: true }
                        : s,
                ),
            );
            try {
                const res = await saveExamRemarks(
                    {
                        school_id: user.record.school_id,
                        session_id: (user.record as any).session_id ?? 22,
                        class_id,
                        section_id,
                        exam_id,
                        student_id: parseInt(student.student_id),
                        remark: student.localRemark,
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
                        res.response_message || "Could not save remark.",
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
        [user?.token, user?.record, class_id, section_id, exam_id, flashToast],
    );

    // ── Filter + Sort ────────────────────────────────────────
    const processed = useMemo(() => {
        const filtered = students.filter(
            (s) =>
                !search ||
                buildFullName(s).toLowerCase().includes(search.toLowerCase()) ||
                s.admission_no.toLowerCase().includes(search.toLowerCase()) ||
                (s.roll_no ?? "").includes(search),
        );
        return sortStudents(filtered, sortKey);
    }, [students, search, sortKey]);

    // ── Summary ─────────────────────────────────────────────
    const summary = useMemo(() => {
        const saved = students.filter((s) => s.saved && !s.dirty).length;
        const filled = students.filter(
            (s) => s.localRemark.trim().length > 0,
        ).length;
        return {
            total: students.length,
            saved,
            filled,
            pending: students.length - filled,
        };
    }, [students]);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={{ flex: 1, backgroundColor: Colors.surface }}>
                {/* Header */}
                <LinearGradient
                    colors={[Colors.amber, "#b45309"]}
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
                                Class {class_name}-{section_name} · {exam_name}
                            </Text>
                            <Text style={styles.headerSub}>
                                {loading
                                    ? "Loading…"
                                    : `${summary.total} students · Exam Remarks`}
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.refreshBtn}
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
                                        { color: "#fde68a" },
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
                                    {summary.pending}
                                </Text>
                                <Text style={styles.sumLbl}>Empty</Text>
                            </View>
                        </View>
                    )}
                </LinearGradient>

                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={Colors.amber} />
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
                                { backgroundColor: Colors.amber },
                            ]}
                            onPress={() => fetchData()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryTxt}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Search + Sort */}
                        <View style={styles.controlsWrap}>
                            <View style={styles.searchBar}>
                                <Text style={{ fontSize: 15 }}>🔍</Text>
                                <TextInput
                                    style={styles.searchInput}
                                    value={search}
                                    onChangeText={setSearch}
                                    placeholder="Search by name, admission or roll no…"
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
                                    tintColor={Colors.amber}
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
                                processed.map((student) => (
                                    <StudentCard
                                        key={student.student_id}
                                        student={student}
                                        onChange={handleChange}
                                        onSave={handleSave}
                                    />
                                ))
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
    refreshBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
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
        backgroundColor: Colors.amber,
        borderColor: Colors.amber,
    },
    sortChipTxt: { fontSize: 11, fontWeight: "600", color: Colors.text2 },
    sortChipTxtActive: { color: "#fff" },
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
    errMsg: {
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
});
