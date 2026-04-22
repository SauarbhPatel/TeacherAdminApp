/**
 * coscholastic-students.tsx
 *
 * Co-Scholastic Grade Entry screen.
 * - Loads student list with existing grades from getCoscholasticMarksEntry
 * - Each student has multiple subjects with grade selectors (A1–D / not graded)
 * - Saves all subjects for one student at once via saveCoscholasticMarksEntry
 * - Search + Sort (same pattern as marks-students.tsx)
 * - SaveToast, optimistic UI, progress tracking
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
    getCoscholasticMarksEntry,
    saveCoscholasticMarksEntry,
} from "@/services/api";
import { CoscholasticStudent, CoscholasticSubject } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

// ─── Grade options ────────────────────────────────────────
const GRADE_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2", "D", "E"];

const GRADE_STYLE: Record<
    string,
    { bg: string; color: string; border: string }
> = {
    A1: { bg: "#e6f9ef", color: "#0a6640", border: "#6ee7b7" },
    A2: { bg: "#e7f9f0", color: "#0a6640", border: "#6ee7b7" },
    B1: { bg: "#eff8ff", color: "#1849a9", border: "#93c5fd" },
    B2: { bg: "#eff8ff", color: "#1849a9", border: "#93c5fd" },
    C1: { bg: "#fffaeb", color: "#93370d", border: "#fcd34d" },
    C2: { bg: "#fffaeb", color: "#93370d", border: "#fcd34d" },
    D: { bg: "#fef3f2", color: "#b42318", border: "#fca5a5" },
    E: { bg: Colors.surface, color: Colors.text3, border: Colors.border },
    "": { bg: Colors.surface, color: Colors.text3, border: Colors.border },
};

function gradeStyle(g: string) {
    return GRADE_STYLE[g] ?? GRADE_STYLE[""];
}

// ─── Sort options (same pattern as marks-students.tsx) ────
type SortKey = "name_asc" | "name_desc" | "adm_asc";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name_asc", label: "Name A→Z" },
    { key: "name_desc", label: "Name Z→A" },
    { key: "adm_asc", label: "Adm. No." },
];

function buildFullName(s: CoscholasticStudent): string {
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
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
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
            default:
                return 0;
        }
    });
}

// ─── Local student type ───────────────────────────────────
interface LocalStudent extends CoscholasticStudent {
    // grades map: cosubject_master_id → grade string
    localGrades: Record<string, string>;
    saving: boolean;
    saved: boolean;
    dirty: boolean;
}

// ─── Save Toast (identical pattern to marks-students.tsx) ─
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
            <Text style={toastS.txt}>✓ Grades saved</Text>
        </Animated.View>
    );
}
const toastS = StyleSheet.create({
    wrap: {
        position: "absolute",
        bottom: 32,
        alignSelf: "center",
        backgroundColor: Colors.green,
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 8,
        zIndex: 999,
        shadowColor: Colors.green,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    txt: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

// ─── Grade Selector Row ───────────────────────────────────
interface GradeSelectorProps {
    subject: CoscholasticSubject;
    grade: string;
    onChange: (grade: string) => void;
}

function GradeSelector({ subject, grade, onChange }: GradeSelectorProps) {
    const gs = gradeStyle(grade);
    return (
        <View style={gs_styles.wrap}>
            {/* Subject code badge */}
            <View style={gs_styles.codeBadge}>
                <Text style={gs_styles.codeText}>{subject.cosubject_code}</Text>
            </View>

            {/* Subject name */}
            <Text style={gs_styles.subjectName} numberOfLines={1}>
                {subject.cosubject_name}
            </Text>

            {/* Grade chips row */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 5 }}
            >
                {GRADE_OPTIONS.map((g) => {
                    const gst = gradeStyle(g);
                    const isActive = grade === g;
                    return (
                        <TouchableOpacity
                            key={g}
                            style={[
                                gs_styles.gradeChip,
                                isActive
                                    ? {
                                          backgroundColor: gst.bg,
                                          borderColor: gst.border,
                                      }
                                    : {
                                          backgroundColor: Colors.surface,
                                          borderColor: Colors.border,
                                      },
                            ]}
                            onPress={() => onChange(isActive ? "" : g)}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[
                                    gs_styles.gradeChipTxt,
                                    {
                                        color: isActive
                                            ? gst.color
                                            : Colors.text3,
                                    },
                                ]}
                            >
                                {g}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}
const gs_styles = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    codeBadge: {
        backgroundColor: Colors.purpleBg,
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 4,
        minWidth: 38,
        alignItems: "center",
        flexShrink: 0,
    },
    codeText: { fontSize: 10, fontWeight: "800", color: Colors.purple },
    subjectName: {
        fontSize: 11,
        fontWeight: "600",
        color: Colors.text2,
        width: 80,
        flexShrink: 0,
    },
    gradeChip: {
        width: 32,
        height: 32,
        borderRadius: 8,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    gradeChipTxt: { fontSize: 10, fontWeight: "800" },
});

// ─── Student Card ─────────────────────────────────────────
interface StudentCardProps {
    student: LocalStudent;
    onGradeChange: (
        studentId: string,
        subjectId: string,
        grade: string,
    ) => void;
    onSave: (student: LocalStudent) => void;
}

function StudentCard({ student, onGradeChange, onSave }: StudentCardProps) {
    const [expanded, setExpanded] = useState(false);
    const name = buildFullName(student);
    const initials = getInitials(name);
    const allGraded = student.subjects.every(
        (s) => student.localGrades[s.cosubject_master_id],
    );
    const gradedCount = student.subjects.filter(
        (s) => student.localGrades[s.cosubject_master_id],
    ).length;

    return (
        <View
            style={[
                card_styles.card,
                student.saved && !student.dirty && card_styles.cardSaved,
            ]}
        >
            {/* Card header — tap to expand */}
            <TouchableOpacity
                style={card_styles.header}
                onPress={() => setExpanded((e) => !e)}
                activeOpacity={0.8}
            >
                {/* Avatar */}
                <View
                    style={[
                        card_styles.avatar,
                        {
                            backgroundColor:
                                student.saved && !student.dirty
                                    ? Colors.greenBg
                                    : student.dirty
                                      ? Colors.amberBg
                                      : Colors.purpleBg,
                        },
                    ]}
                >
                    {student.saving ? (
                        <ActivityIndicator size="small" color={Colors.purple} />
                    ) : (
                        <Text
                            style={[
                                card_styles.avatarTxt,
                                {
                                    color:
                                        student.saved && !student.dirty
                                            ? Colors.green
                                            : student.dirty
                                              ? Colors.amber
                                              : Colors.purple,
                                },
                            ]}
                        >
                            {student.saved && !student.dirty ? "✓" : initials}
                        </Text>
                    )}
                </View>

                {/* Student info */}
                <View style={{ flex: 1 }}>
                    <Text style={card_styles.name} numberOfLines={1}>
                        {name}
                    </Text>
                    <View style={card_styles.metaRow}>
                        <Text style={card_styles.metaChip}>
                            #{student.admission_no}
                        </Text>
                        {student.roll_no ? (
                            <Text style={card_styles.metaChip}>
                                Roll {student.roll_no}
                            </Text>
                        ) : null}
                    </View>
                </View>

                {/* Right side: progress + expand arrow */}
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <View
                        style={[
                            card_styles.progressBadge,
                            {
                                backgroundColor: allGraded
                                    ? Colors.greenBg
                                    : Colors.amberBg,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                card_styles.progressTxt,
                                {
                                    color: allGraded
                                        ? Colors.greenText
                                        : Colors.amberText,
                                },
                            ]}
                        >
                            {gradedCount}/{student.subjects.length}
                        </Text>
                    </View>
                    <Text style={card_styles.expandArrow}>
                        {expanded ? "▲" : "▼"}
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Expanded: grade selectors */}
            {expanded && (
                <View style={card_styles.body}>
                    {student.subjects.map((subject) => (
                        <GradeSelector
                            key={subject.cosubject_master_id}
                            subject={subject}
                            grade={
                                student.localGrades[
                                    subject.cosubject_master_id
                                ] ?? ""
                            }
                            onChange={(grade) =>
                                onGradeChange(
                                    student.student_id,
                                    subject.cosubject_master_id,
                                    grade,
                                )
                            }
                        />
                    ))}

                    {/* Save button */}
                    <TouchableOpacity
                        style={[
                            card_styles.saveBtn,
                            student.saving && { opacity: 0.7 },
                        ]}
                        onPress={() => onSave(student)}
                        disabled={student.saving}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={
                                student.saved && !student.dirty
                                    ? [Colors.green, "#0a8a50"]
                                    : [Colors.purple, Colors.purpleDark]
                            }
                            style={card_styles.saveBtnGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {student.saving ? (
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <ActivityIndicator
                                        size="small"
                                        color="#fff"
                                    />
                                    <Text style={card_styles.saveBtnTxt}>
                                        Saving…
                                    </Text>
                                </View>
                            ) : (
                                <Text style={card_styles.saveBtnTxt}>
                                    {student.saved && !student.dirty
                                        ? "✓ Grades Saved"
                                        : "Save Grades"}
                                </Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const card_styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        ...Shadow.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: 10,
        overflow: "hidden",
    },
    cardSaved: { borderColor: Colors.greenBg },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: Spacing.lg,
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
    progressBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    progressTxt: { fontSize: 11, fontWeight: "800" },
    expandArrow: { fontSize: 10, color: Colors.text3, fontWeight: "700" },
    body: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    saveBtn: {
        borderRadius: Radius.md,
        overflow: "hidden",
        marginTop: 12,
        ...Shadow.sm,
    },
    saveBtnGrad: {
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    saveBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "800" },
});

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function CoscholasticStudentsScreen() {
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

    // Toast
    const [showToast, setShowToast] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashToast = useCallback(() => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setShowToast(true);
        toastTimer.current = setTimeout(() => setShowToast(false), 1800);
    }, []);

    // ── Fetch data ───────────────────────────────────────────
    const fetchData = useCallback(
        async (silent = false) => {
            if (!user?.token || !user.record) return;
            if (!silent) {
                setLoading(true);
                setError("");
            }
            try {
                const res = await getCoscholasticMarksEntry(
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
                        (s) => {
                            const localGrades: Record<string, string> = {};
                            s.subjects.forEach((sub) => {
                                localGrades[sub.cosubject_master_id] =
                                    sub.grade ?? "";
                            });
                            return {
                                ...s,
                                localGrades,
                                saving: false,
                                saved: true,
                                dirty: false,
                            };
                        },
                    );
                    setStudents(mapped);
                } else {
                    setError(
                        res.response_message || "Failed to load students.",
                    );
                }
            } catch (e: any) {
                setError(e?.message || "Network error. Please try again.");
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

    // ── Grade change ─────────────────────────────────────────
    const handleGradeChange = useCallback(
        (studentId: string, subjectId: string, grade: string) => {
            setStudents((prev) =>
                prev.map((s) =>
                    s.student_id === studentId
                        ? {
                              ...s,
                              localGrades: {
                                  ...s.localGrades,
                                  [subjectId]: grade,
                              },
                              dirty: true,
                              saved: false,
                          }
                        : s,
                ),
            );
        },
        [],
    );

    // ── Save one student (all subjects at once) ──────────────
    const handleSave = useCallback(
        async (student: LocalStudent) => {
            if (!user?.token || !user.record) return;

            // Build arrays — only subjects that have a grade
            const gradedSubjects = student.subjects.filter(
                (s) => student.localGrades[s.cosubject_master_id],
            );

            if (gradedSubjects.length === 0) {
                Alert.alert(
                    "No Grades",
                    "Please assign at least one grade before saving.",
                );
                return;
            }

            // Optimistic
            setStudents((prev) =>
                prev.map((s) =>
                    s.student_id === student.student_id
                        ? { ...s, saving: true }
                        : s,
                ),
            );

            try {
                const res = await saveCoscholasticMarksEntry(
                    {
                        school_id: user.record.school_id,
                        session_id: (user.record as any).session_id ?? 22,
                        class_id,
                        section_id,
                        exam_id,
                        student_ids: parseInt(student.student_id),
                        subject_ids: gradedSubjects.map((s) =>
                            parseInt(s.cosubject_master_id),
                        ),
                        grades: gradedSubjects.map(
                            (s) => student.localGrades[s.cosubject_master_id],
                        ),
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
                        res.response_message || "Could not save grades.",
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
                s.admission_no.toLowerCase().includes(search.toLowerCase()),
        );
        return sortStudents(filtered, sortKey);
    }, [students, search, sortKey]);

    // ── Summary ─────────────────────────────────────────────
    const summary = useMemo(() => {
        const saved = students.filter((s) => s.saved && !s.dirty).length;
        const pending = students.length - saved;
        return { total: students.length, saved, pending };
    }, [students]);

    // ─────────────────────────────────────────────────────────
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
                                : `${summary.total} students · Co-Scholastic Grades`}
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
                        <Text style={{ fontSize: 16, color: "#fff" }}>↻</Text>
                    </TouchableOpacity>
                </View>

                {/* Summary pills */}
                {!loading && (
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryPill}>
                            <Text style={styles.sumNum}>{summary.total}</Text>
                            <Text style={styles.sumLbl}>Total</Text>
                        </View>
                        <View style={styles.summaryPill}>
                            <Text style={[styles.sumNum, { color: "#4ade80" }]}>
                                {summary.saved}
                            </Text>
                            <Text style={styles.sumLbl}>Saved</Text>
                        </View>
                        <View style={styles.summaryPill}>
                            <Text style={[styles.sumNum, { color: "#fbbf24" }]}>
                                {summary.pending}
                            </Text>
                            <Text style={styles.sumLbl}>Pending</Text>
                        </View>
                        <View style={styles.summaryPill}>
                            <Text style={[styles.sumNum, { color: "#c4b5fd" }]}>
                                {students[0]?.subjects.length ?? 0}
                            </Text>
                            <Text style={styles.sumLbl}>Subjects</Text>
                        </View>
                    </View>
                )}
            </LinearGradient>

            {/* ── Body ── */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.purple} />
                    <Text style={styles.loadTxt}>Loading students…</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
                    <Text style={styles.errTitle}>Could not load students</Text>
                    <Text style={styles.errMsg}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => fetchData()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryTxt}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* ── Search + Sort ── */}
                    <View style={styles.controlsWrap}>
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
                                            {sortKey === opt.key ? "✓ " : ""}
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
                                tintColor={Colors.purple}
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
                                    style={{ fontSize: 36, marginBottom: 10 }}
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
                                    onGradeChange={handleGradeChange}
                                    onSave={handleSave}
                                />
                            ))
                        )}
                    </ScrollView>
                </>
            )}

            {/* ── Toast ── */}
            <SaveToast visible={showToast} />
        </View>
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
        backgroundColor: Colors.purple,
        borderColor: Colors.purple,
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
    errMsg: {
        fontSize: 13,
        color: Colors.text3,
        textAlign: "center",
        lineHeight: 20,
    },
    retryBtn: {
        marginTop: 16,
        backgroundColor: Colors.purple,
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
