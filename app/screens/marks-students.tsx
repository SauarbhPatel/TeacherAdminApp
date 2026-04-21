/**
 * marks-students.tsx
 *
 * Two tabs:
 *   "Student-wise" — one card per student, tap → marks-form (existing flow)
 *   "Subject-wise" — one card per subject, shows all students' marks inline,
 *                    with editable cells that auto-save on blur.
 *
 * Sorting: student name A-Z / Z-A, admission no, percentage high/low.
 */

import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Animated,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import {
    getClassSectionMarksheet,
    saveStudentMarksEntry,
} from "@/services/api";
import { MarksStudent, MarksSubject } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

// ─── Grade colour map ────────────────────────────────────
const GRADE_COLOR: Record<string, { bg: string; text: string }> = {
    A1: { bg: "#e6f9ef", text: "#0a6640" },
    A2: { bg: "#e7f9f0", text: "#0a6640" },
    B1: { bg: "#eff8ff", text: "#1849a9" },
    B2: { bg: "#eff8ff", text: "#1849a9" },
    C1: { bg: "#fffaeb", text: "#93370d" },
    C2: { bg: "#fffaeb", text: "#93370d" },
    D: { bg: "#fef3f2", text: "#b42318" },
};
function gradeStyle(g: string) {
    return GRADE_COLOR[g] ?? { bg: Colors.surface, text: Colors.text3 };
}
function pctColor(p: string | number) {
    const n = parseFloat(String(p));
    if (n >= 80) return Colors.green;
    if (n >= 60) return Colors.blue;
    if (n >= 40) return Colors.amber;
    return Colors.red;
}
function calcGrade(obtained: number, max: number) {
    if (!max) return { pct: "0.0", grade: "—" };
    const p = (obtained / max) * 100;
    return {
        pct: p.toFixed(1),
        grade:
            p >= 91
                ? "A1"
                : p >= 81
                  ? "A2"
                  : p >= 71
                    ? "B1"
                    : p >= 61
                      ? "B2"
                      : p >= 51
                        ? "C1"
                        : p >= 41
                          ? "C2"
                          : "D",
    };
}

// ─── Mini bar ────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
    return (
        <View
            style={{
                height: 4,
                backgroundColor: Colors.border,
                borderRadius: 2,
                overflow: "hidden",
                marginTop: 5,
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

// ─── Sort options ────────────────────────────────────────
type SortKey = "name_asc" | "name_desc" | "adm_asc" | "pct_high" | "pct_low";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "name_asc", label: "Name A→Z" },
    { key: "name_desc", label: "Name Z→A" },
    { key: "adm_asc", label: "Adm. No." },
    { key: "pct_high", label: "% High" },
    { key: "pct_low", label: "% Low" },
];

function sortStudents(list: MarksStudent[], key: SortKey): MarksStudent[] {
    return [...list].sort((a, b) => {
        switch (key) {
            case "name_asc":
                return a.student_name.localeCompare(b.student_name);
            case "name_desc":
                return b.student_name.localeCompare(a.student_name);
            case "adm_asc":
                return a.admission_no.localeCompare(b.admission_no, undefined, {
                    numeric: true,
                });
            case "pct_high": {
                const pa = parseFloat(a.exams[0]?.percentage ?? "0");
                const pb = parseFloat(b.exams[0]?.percentage ?? "0");
                return pb - pa;
            }
            case "pct_low": {
                const pa = parseFloat(a.exams[0]?.percentage ?? "0");
                const pb = parseFloat(b.exams[0]?.percentage ?? "0");
                return pa - pb;
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
            <Text style={toastS.txt}>✓ Marks saved</Text>
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

// ═══════════════════════════════════════════════════════
// SUBJECT-WISE TAB
// ═══════════════════════════════════════════════════════
interface SubjectWiseProps {
    students: MarksStudent[];
    params: Record<string, string>;
    user: any;
    onToast: () => void;
}

const SUBJECT_COLORS = [
    {
        bg: Colors.purpleBg,
        color: Colors.purple,
        border: "#d8c5f7",
        grad: [Colors.purple, Colors.purpleDeeper] as [string, string],
    },
    {
        bg: Colors.blueBg,
        color: Colors.blue,
        border: "#c3e0fd",
        grad: [Colors.blue, "#1849a9"] as [string, string],
    },
    {
        bg: Colors.greenBg,
        color: Colors.green,
        border: "#a8e8cc",
        grad: [Colors.green, "#0a8a50"] as [string, string],
    },
    {
        bg: Colors.amberBg,
        color: Colors.amber,
        border: "#fcd96a",
        grad: [Colors.amber, "#b45309"] as [string, string],
    },
    {
        bg: Colors.pinkBg,
        color: Colors.pink,
        border: "#f5b8e8",
        grad: [Colors.pink, "#9d174d"] as [string, string],
    },
    {
        bg: Colors.tealBg,
        color: Colors.teal,
        border: "#99e6da",
        grad: [Colors.teal, "#0f766e"] as [string, string],
    },
];

function SubjectWiseTab({ students, params, user, onToast }: SubjectWiseProps) {
    const subjects: MarksSubject[] = students[0]?.exams[0]?.subjects ?? [];
    const [selSubjectId, setSelSubjectId] = useState<string>(
        subjects[0]?.subject_id ?? "",
    );

    // ── Search + Sort state (mirrors student-wise tab) ──
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("name_asc");

    // Local marks map: studentId → subjectId → value
    const [marksMap, setMarksMap] = useState<
        Record<string, Record<string, string>>
    >(() => {
        const init: Record<string, Record<string, string>> = {};
        students.forEach((s) => {
            init[s.student_id] = {};
            s.exams[0]?.subjects.forEach((sub) => {
                init[s.student_id][sub.subject_id] = String(sub.marks_obtained);
            });
        });
        return init;
    });

    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [saved, setSaved] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        students.forEach((s) => {
            s.exams[0]?.subjects.forEach((sub) => {
                init[`${s.student_id}_${sub.subject_id}`] = true;
            });
        });
        return init;
    });

    const saveOne = useCallback(
        async (student: MarksStudent, subject: MarksSubject, value: string) => {
            if (!user?.token || !user.record) return;
            const obtained = parseInt(value) || 0;
            if (obtained > subject.max_marks) return;
            const key = `${student.student_id}_${subject.subject_id}`;
            setSaving((p) => ({ ...p, [key]: true }));
            try {
                const res = await saveStudentMarksEntry(
                    {
                        school_id: user.record.school_id,
                        session_id: user.record.session_id ?? 22,
                        class_id: params.class_id,
                        section_id: params.section_id,
                        exam_master_id: params.exam_master_id ?? params.exam_id,
                        student_id: student.student_id,
                        subject_master_id: parseInt(subject.subject_id),
                        marks_obtained: obtained,
                    },
                    user.token,
                );
                if (res.response_code === 200) {
                    setSaved((p) => ({ ...p, [key]: true }));
                    onToast();
                } else {
                    Alert.alert("Save Failed", res.response_message);
                }
            } catch (e: any) {
                Alert.alert("Network Error", e?.message);
            } finally {
                setSaving((p) => ({ ...p, [key]: false }));
            }
        },
        [user, params, onToast],
    );

    // ── Filter + Sort students (same logic as student-wise) ──
    const filteredStudents = useMemo(() => {
        const filtered = students.filter(
            (s) =>
                !search ||
                s.student_name.toLowerCase().includes(search.toLowerCase()) ||
                s.admission_no.toLowerCase().includes(search.toLowerCase()),
        );
        return sortStudents(filtered, sortKey);
    }, [students, search, sortKey]);

    if (subjects.length === 0) {
        return (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
                <Text style={{ fontSize: 36, marginBottom: 12 }}>📭</Text>
                <Text style={{ color: Colors.text3, fontSize: 14 }}>
                    No subject data available
                </Text>
            </View>
        );
    }

    const selSubject =
        subjects.find((s) => s.subject_id === selSubjectId) ?? subjects[0];
    const selSubjectIdx = subjects.findIndex(
        (s) => s.subject_id === selSubjectId,
    );
    const subjectColor = SUBJECT_COLORS[selSubjectIdx % SUBJECT_COLORS.length];

    const savedForSubject = students.filter(
        (s) => saved[`${s.student_id}_${selSubjectId}`],
    ).length;

    return (
        <View style={{ flex: 1 }}>
            {/* ── Horizontal subject chip strip ── */}
            <View style={sw.chipStrip}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        gap: 8,
                        paddingHorizontal: Spacing.lg,
                        paddingVertical: 12,
                    }}
                >
                    {subjects.map((subject, i) => {
                        const sc = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                        const isActive = subject.subject_id === selSubjectId;
                        const savedCount = students.filter(
                            (s) =>
                                saved[`${s.student_id}_${subject.subject_id}`],
                        ).length;
                        return (
                            <TouchableOpacity
                                key={subject.subject_id}
                                style={[
                                    sw.subjectChip,
                                    isActive
                                        ? {
                                              backgroundColor: sc.color,
                                              borderColor: sc.color,
                                          }
                                        : {
                                              backgroundColor: sc.bg,
                                              borderColor: sc.border,
                                          },
                                ]}
                                onPress={() =>
                                    setSelSubjectId(subject.subject_id)
                                }
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        sw.chipIconWrap,
                                        {
                                            backgroundColor: isActive
                                                ? "rgba(255,255,255,0.25)"
                                                : sc.bg,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            sw.chipInitial,
                                            {
                                                color: isActive
                                                    ? "#fff"
                                                    : sc.color,
                                            },
                                        ]}
                                    >
                                        {subject.subject_name[0]}
                                    </Text>
                                </View>
                                <View>
                                    <Text
                                        style={[
                                            sw.chipName,
                                            {
                                                color: isActive
                                                    ? "#fff"
                                                    : sc.color,
                                            },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {subject.subject_name}
                                    </Text>
                                    <Text
                                        style={[
                                            sw.chipMax,
                                            {
                                                color: isActive
                                                    ? "rgba(255,255,255,0.75)"
                                                    : Colors.text3,
                                            },
                                        ]}
                                    >
                                        /{subject.max_marks} · {savedCount}/
                                        {students.length} saved
                                    </Text>
                                </View>
                                {isActive && <View style={sw.chipActiveDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ── Selected subject banner ── */}
            <LinearGradient
                colors={subjectColor.grad}
                style={sw.selSubjectBanner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={sw.bannerIconWrap}>
                    <Text style={sw.bannerInitial}>
                        {selSubject.subject_name[0]}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={sw.bannerName}>{selSubject.subject_name}</Text>
                    <Text style={sw.bannerSub}>
                        Max: {selSubject.max_marks} marks · {students.length}{" "}
                        students
                    </Text>
                </View>
                <View style={sw.bannerProgress}>
                    <Text style={sw.bannerSavedNum}>{savedForSubject}</Text>
                    <Text style={sw.bannerSavedLbl}>saved</Text>
                </View>
            </LinearGradient>

            {/* ── Search + Sort (mirrors student-wise controls) ── */}
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
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={{ color: Colors.text3, fontSize: 16 }}>
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

            {/* ── Column headers ── */}
            <View style={sw.colHeader}>
                <Text style={[sw.colTxt, { flex: 1 }]}>
                    Student
                    {search ? ` (${filteredStudents.length} results)` : ""}
                </Text>
                <Text style={[sw.colTxt, { width: 70, textAlign: "center" }]}>
                    Marks
                </Text>
            </View>

            {/* ── Student list for selected subject ── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
                scrollEnabled={false}
            >
                {filteredStudents.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Text style={{ fontSize: 36, marginBottom: 10 }}>
                            🔍
                        </Text>
                        <Text style={{ color: Colors.text3, fontSize: 14 }}>
                            No students found
                        </Text>
                    </View>
                ) : (
                    filteredStudents.map((student, idx) => {
                        const key = `${student.student_id}_${selSubjectId}`;
                        const val =
                            marksMap[student.student_id]?.[selSubjectId] ?? "";
                        const obtained = parseInt(val) || 0;
                        const { pct, grade } = calcGrade(
                            obtained,
                            selSubject.max_marks,
                        );
                        const isErr = obtained > selSubject.max_marks;
                        const isSaving = saving[key];
                        const isSaved = saved[key];
                        const gc = gradeStyle(grade);
                        const barClr = pctColor(pct);
                        const pctNum = parseFloat(pct);
                        const initials = student.student_name
                            .trim()
                            .split(" ")
                            .map((w: string) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();

                        return (
                            <View
                                key={student.student_id}
                                style={[
                                    sw.studentRow,
                                    idx % 2 === 1 && sw.rowAlt,
                                ]}
                            >
                                {/* Left border accent */}
                                <View
                                    style={[
                                        sw.leftAccent,
                                        {
                                            backgroundColor:
                                                isSaved && !isErr
                                                    ? Colors.green
                                                    : isErr
                                                      ? Colors.red
                                                      : Colors.border,
                                        },
                                    ]}
                                />

                                {/* Avatar */}
                                <View
                                    style={[
                                        sw.miniAvatar,
                                        {
                                            backgroundColor:
                                                isSaved && !isErr
                                                    ? Colors.greenBg
                                                    : isErr
                                                      ? Colors.redBg
                                                      : Colors.purpleBg,
                                        },
                                    ]}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator
                                            size="small"
                                            color={Colors.purple}
                                        />
                                    ) : (
                                        <Text
                                            style={[
                                                sw.miniAvatarTxt,
                                                {
                                                    color:
                                                        isSaved && !isErr
                                                            ? Colors.green
                                                            : isErr
                                                              ? Colors.red
                                                              : Colors.purple,
                                                },
                                            ]}
                                        >
                                            {isSaved && !isErr ? "✓" : initials}
                                        </Text>
                                    )}
                                </View>

                                {/* Name + admission */}
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text
                                        style={sw.studentName}
                                        numberOfLines={1}
                                    >
                                        {student.student_name.trim()}
                                    </Text>

                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaChip}>
                                            #{student.admission_no}
                                        </Text>
                                        {student.father_name ? (
                                            <Text style={styles.metaGray}>
                                                👤 {student.father_name}
                                            </Text>
                                        ) : null}
                                    </View>
                                </View>

                                {/* Marks input */}
                                <View
                                    style={{ width: 70, alignItems: "center" }}
                                >
                                    <View
                                        style={[
                                            sw.inputWrap,
                                            {
                                                borderColor: isErr
                                                    ? Colors.red
                                                    : isSaved
                                                      ? Colors.green
                                                      : Colors.border,
                                            },
                                            isErr && sw.inputErr,
                                        ]}
                                    >
                                        <TextInput
                                            style={[
                                                sw.input,
                                                {
                                                    color: isErr
                                                        ? Colors.red
                                                        : Colors.text1,
                                                    padding: 0,
                                                },
                                            ]}
                                            textAlignVertical="center"
                                            value={val}
                                            onChangeText={(v) => {
                                                const clean = v.replace(
                                                    /[^0-9]/g,
                                                    "",
                                                );
                                                setMarksMap((prev) => ({
                                                    ...prev,
                                                    [student.student_id]: {
                                                        ...prev[
                                                            student.student_id
                                                        ],
                                                        [selSubjectId]: clean,
                                                    },
                                                }));
                                                setSaved((p) => ({
                                                    ...p,
                                                    [key]: false,
                                                }));
                                            }}
                                            onBlur={() => {
                                                if (!isErr && val !== "")
                                                    saveOne(
                                                        student,
                                                        selSubject,
                                                        val,
                                                    );
                                            }}
                                            keyboardType="numeric"
                                            maxLength={3}
                                            selectTextOnFocus
                                            placeholder="—"
                                            placeholderTextColor={Colors.text3}
                                            editable={!isSaving}
                                        />
                                    </View>
                                    <Text
                                        style={[
                                            sw.maxMarkTxt,
                                            {
                                                color: isErr
                                                    ? Colors.red
                                                    : Colors.text3,
                                            },
                                        ]}
                                    >
                                        {isErr
                                            ? "Max: " + selSubject.max_marks
                                            : `/ ${selSubject.max_marks}`}
                                    </Text>
                                </View>
                            </View>
                        );
                    })
                )}
            </ScrollView>
        </View>
    );
}

const sw = StyleSheet.create({
    // Chip strip
    chipStrip: {
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    subjectChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1.5,
        position: "relative",
        minWidth: 140,
    },
    chipIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    chipInitial: { fontSize: 13, fontWeight: "900" },
    chipName: { fontSize: 12, fontWeight: "700" },
    chipMax: { fontSize: 9, marginTop: 1 },
    chipActiveDot: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255,255,255,0.8)",
    },

    // Selected subject banner
    selSubjectBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 12,
    },
    bannerIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
    },
    bannerInitial: { fontSize: 18, fontWeight: "900", color: "#fff" },
    bannerName: { fontSize: 15, fontWeight: "800", color: "#fff" },
    bannerSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 1 },
    bannerProgress: { alignItems: "center" },
    bannerSavedNum: { fontSize: 20, fontWeight: "900", color: "#fff" },
    bannerSavedLbl: {
        fontSize: 9,
        fontWeight: "600",
        color: "rgba(255,255,255,0.7)",
    },

    // Column header
    colHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: Colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    colTxt: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.text3,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    // Student row
    studentRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingRight: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    rowAlt: { backgroundColor: Colors.surface + "88" },
    leftAccent: {
        width: 3,
        alignSelf: "stretch",
        borderRadius: 2,
        marginRight: 4,
    },
    miniAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    miniAvatarTxt: { fontSize: 11, fontWeight: "800" },
    studentName: { fontSize: 12, fontWeight: "700", color: Colors.text1 },
    studentAdm: { fontSize: 10, color: Colors.text3, marginTop: 1 },

    // Input
    inputWrap: {
        width: 52,
        height: 36,
        borderRadius: 10,
        borderWidth: 1.5,
        backgroundColor: Colors.white,
        alignItems: "center",
        justifyContent: "center",
    },
    inputErr: { backgroundColor: Colors.redBg },
    input: {
        fontSize: 16,
        fontWeight: "900",
        textAlign: "center",
        width: "100%",
    },
    maxMarkTxt: { fontSize: 9, marginTop: 2, fontWeight: "600" },

    pctTxt: { fontSize: 11, fontWeight: "700", textAlign: "center" },
    gradeChip: {
        height: 24,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
    },
    gradeChipTxt: { fontSize: 11, fontWeight: "800" },
});

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
type TabKey = "student" | "subject";

export default function MarksStudentsScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const params = useLocalSearchParams<{
        class_id: string;
        class_name: string;
        section_id: string;
        section_name: string;
        exam_id: string;
        exam_name: string;
        exam_master_id?: string;
    }>();
    const {
        class_id,
        class_name,
        section_id,
        section_name,
        exam_id,
        exam_name,
    } = params;

    const [students, setStudents] = useState<MarksStudent[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [sortKey, setSortKey] = useState<SortKey>("name_asc");
    const [showSort, setShowSort] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>("student");

    // Toast
    const [showToast, setShowToast] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashToast = () => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setShowToast(true);
        toastTimer.current = setTimeout(() => setShowToast(false), 1600);
    };

    // ── Fetch marksheet ─────────────────────────────────────
    const fetchData = useCallback(
        async (silent = false) => {
            if (!user?.token || !user.record) return;
            if (!silent) {
                setLoading(true);
                setError("");
            }
            try {
                const res = await getClassSectionMarksheet(
                    {
                        school_id: user.record.school_id,
                        session_id: user.record.session_id ?? 22,
                        class_id,
                        section_id,
                        exam_id,
                    },
                    user.token,
                );

                if (res.response_code === 200) {
                    setStudents(res.students ?? []);
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

    // ── Filter + Sort ────────────────────────────────────────
    const processed = useMemo(() => {
        const filtered = students.filter(
            (s) =>
                !search ||
                s.student_name.toLowerCase().includes(search.toLowerCase()) ||
                s.admission_no.toLowerCase().includes(search.toLowerCase()),
        );
        return sortStudents(filtered, sortKey);
    }, [students, search, sortKey]);

    // ── Summary ─────────────────────────────────────────────
    const summary = useMemo(() => {
        const grades: Record<string, number> = {};
        let totalPct = 0;
        students.forEach((s) => {
            const ex = s.exams[0];
            if (ex) {
                grades[ex.grade_name] = (grades[ex.grade_name] || 0) + 1;
                totalPct += parseFloat(ex.percentage);
            }
        });
        return {
            total: students.length,
            avgPct: students.length
                ? (totalPct / students.length).toFixed(1)
                : "0",
            grades,
        };
    }, [students]);

    const currentSortLabel =
        SORT_OPTIONS.find((o) => o.key === sortKey)?.label ?? "Sort";

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
                                : `${summary.total} students · Avg ${summary.avgPct}%`}
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
                                {summary.avgPct}%
                            </Text>
                            <Text style={styles.sumLbl}>Avg</Text>
                        </View>
                        {Object.entries(summary.grades)
                            .slice(0, 3)
                            .map(([g, count]) => (
                                <View key={g} style={styles.summaryPill}>
                                    <Text
                                        style={[
                                            styles.sumNum,
                                            { color: "#fbbf24" },
                                        ]}
                                    >
                                        {count}
                                    </Text>
                                    <Text style={styles.sumLbl}>Grade {g}</Text>
                                </View>
                            ))}
                    </View>
                )}
            </LinearGradient>

            {/* ── Tabs ── */}
            <View style={styles.tabsWrap}>
                {(
                    [
                        { key: "student", label: "👤 Student-wise" },
                        { key: "subject", label: "📚 Subject-wise" },
                    ] as { key: TabKey; label: string }[]
                ).map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        style={[
                            styles.tab,
                            activeTab === t.key && styles.tabActive,
                        ]}
                        onPress={() => setActiveTab(t.key)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.tabTxt,
                                activeTab === t.key && styles.tabTxtActive,
                            ]}
                        >
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{}}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.purple}
                    />
                }
            >
                {/* ── Search + Sort (student tab only) ── */}
                {activeTab === "student" && (
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

                        {/* Sort row */}
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
                )}

                {/* ── Body ── */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color={Colors.purple} />
                        <Text style={styles.loadTxt}>Loading marksheet…</Text>
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
                            style={styles.retryBtn}
                            onPress={() => fetchData()}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retryTxt}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : activeTab === "subject" ? (
                    <View style={{ flex: 1 }}>
                        <SubjectWiseTab
                            students={students}
                            params={params as any}
                            user={user}
                            onToast={flashToast}
                        />
                    </View>
                ) : (
                    // ── Student-wise tab ──────────────────────────────────
                    <ScrollView
                        scrollEnabled={false}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{
                            padding: Spacing.lg,
                            paddingTop: 8,
                            gap: 8,
                            paddingBottom: 32,
                        }}
                        // refreshControl={
                        //     <RefreshControl
                        //         refreshing={refreshing}
                        //         onRefresh={onRefresh}
                        //         tintColor={Colors.purple}
                        //     />
                        // }
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
                            processed.map((student) => {
                                const exam = student.exams[0];
                                const pct = exam
                                    ? parseFloat(exam.percentage)
                                    : 0;
                                const barClr = pctColor(
                                    exam?.percentage ?? "0",
                                );
                                const gs = gradeStyle(exam?.grade_name ?? "");
                                const initials = student.student_name
                                    .trim()
                                    .split(" ")
                                    .map((w: string) => w[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase();

                                return (
                                    <TouchableOpacity
                                        key={student.student_session_id}
                                        style={styles.studentCard}
                                        onPress={() =>
                                            router.push({
                                                pathname: "/screens/marks-form",
                                                params: {
                                                    student_data:
                                                        JSON.stringify(student),
                                                    exam_name,
                                                    class_name,
                                                    section_name,
                                                    class_id,
                                                    section_id,
                                                    exam_master_id:
                                                        params.exam_master_id ??
                                                        exam_id,
                                                },
                                            })
                                        }
                                        activeOpacity={0.82}
                                    >
                                        <View style={styles.cardLeft}>
                                            <View
                                                style={[
                                                    styles.avatar,
                                                    {
                                                        backgroundColor:
                                                            Colors.purpleBg,
                                                    },
                                                ]}
                                            >
                                                <Text style={styles.avatarTxt}>
                                                    {initials}
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text
                                                    style={styles.studentName}
                                                >
                                                    {student.student_name.trim()}
                                                </Text>
                                                <View style={styles.metaRow}>
                                                    <Text
                                                        style={styles.metaChip}
                                                    >
                                                        #{student.admission_no}
                                                    </Text>
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
                                        </View>

                                        <View style={styles.cardRight}>
                                            <View
                                                style={[
                                                    styles.gradeBadge,
                                                    { backgroundColor: gs.bg },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.gradeText,
                                                        { color: gs.text },
                                                    ]}
                                                >
                                                    {exam?.grade_name ?? "—"}
                                                </Text>
                                            </View>
                                            <Text
                                                style={[
                                                    styles.scoreText,
                                                    { color: barClr },
                                                ]}
                                            >
                                                {exam
                                                    ? `${exam.marks_obtained}/${exam.max_marks}`
                                                    : "—"}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.pctText,
                                                    { color: barClr },
                                                ]}
                                            >
                                                {exam?.percentage ?? "0"}%
                                            </Text>
                                        </View>

                                        <View
                                            style={{
                                                width: "100%",
                                                marginTop: 4,
                                            }}
                                        >
                                            <Bar pct={pct} color={barClr} />
                                            <Text style={styles.editHint}>
                                                Tap to edit marks →
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                )}
            </ScrollView>

            {/* Toast */}
            <SaveToast visible={showToast} />
        </View>
    );
}

// ─────────────────────────────────────────────────────────
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

    // Tabs
    tabsWrap: {
        flexDirection: "row",
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderBottomWidth: 2.5,
        borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: Colors.purple },
    tabTxt: { fontSize: 13, fontWeight: "600", color: Colors.text3 },
    tabTxtActive: { color: Colors.purple, fontWeight: "800" },

    // Controls — shared between student-wise and subject-wise
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
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: Colors.text1,
    },
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

    // Student cards
    studentCard: {
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        padding: 14,
        flexWrap: "wrap",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        ...Shadow.sm,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    avatarTxt: { fontSize: 14, fontWeight: "800", color: Colors.purple },
    studentName: { fontSize: 14, fontWeight: "700", color: Colors.text1 },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 3,
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
    cardRight: { alignItems: "flex-end", gap: 2 },
    gradeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    gradeText: { fontSize: 11, fontWeight: "800" },
    scoreText: { fontSize: 13, fontWeight: "800" },
    pctText: { fontSize: 11, fontWeight: "600" },
    editHint: {
        fontSize: 10,
        color: Colors.text3,
        marginTop: 4,
        textAlign: "right",
        fontStyle: "italic",
    },
});
