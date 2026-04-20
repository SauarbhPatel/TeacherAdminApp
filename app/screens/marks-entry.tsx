/**
 * marks-entry.tsx
 *
 * 3-step selector with live API data:
 *   Step 1 → Select Class  (GET /webservice/getClassSectionList)
 *   Step 2 → Select Section (from same response)
 *   Step 3 → Select Exam   (POST /Webservice/getClassExamList)
 * Then navigates to marks-students screen.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getClassSectionList, getClassExamList } from "@/services/api";
import { ClassWithSections, ClassSection, ExamItem } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

type Step = 1 | 2 | 3;

interface Selection {
    class_id: string;
    class_name: string;
    section_id: string;
    section_name: string;
    exam_id: string;
    exam_name: string;
}

const ACCENT = [
    Colors.purple,
    Colors.blue,
    Colors.green,
    Colors.amber,
    Colors.pink,
    Colors.teal,
    "#7c3aed",
    "#0891b2",
    "#d97706",
];

// ─── Step indicator ──────────────────────────────────────
function StepBar({ current }: { current: Step }) {
    const steps = [
        { n: 1, label: "Class" },
        { n: 2, label: "Section" },
        { n: 3, label: "Exam" },
    ];
    return (
        <View style={bar.row}>
            {steps.map((s, i) => {
                const done = current > s.n;
                const active = current === s.n;
                return (
                    <React.Fragment key={s.n}>
                        <View style={bar.item}>
                            <View
                                style={[
                                    bar.circle,
                                    done && bar.done,
                                    active && bar.active,
                                ]}
                            >
                                <Text
                                    style={[
                                        bar.num,
                                        (done || active) && bar.numActive,
                                    ]}
                                >
                                    {done ? "✓" : s.n}
                                </Text>
                            </View>
                            <Text style={[bar.lbl, active && bar.lblActive]}>
                                {s.label}
                            </Text>
                        </View>
                        {i < 2 && (
                            <View style={[bar.line, done && bar.lineDone]} />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
}
const bar = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: Spacing.xl,
        paddingVertical: 14,
        zIndex: 1,
    },
    item: { alignItems: "center", gap: 4 },
    circle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.18)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.25)",
    },
    done: {
        backgroundColor: "rgba(255,255,255,0.9)",
        borderColor: "transparent",
    },
    active: { backgroundColor: "#fff", borderColor: "transparent" },
    num: { fontSize: 13, fontWeight: "800", color: "rgba(255,255,255,0.7)" },
    numActive: { color: Colors.purple },
    lbl: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.55)" },
    lblActive: { color: "#fff", fontWeight: "700" },
    line: {
        flex: 1,
        height: 2,
        backgroundColor: "rgba(255,255,255,0.18)",
        marginTop: 15,
        marginHorizontal: 4,
    },
    lineDone: { backgroundColor: "rgba(255,255,255,0.7)" },
});

// ─── Breadcrumb pills ────────────────────────────────────
function Pill({
    label,
    value,
    onClear,
}: {
    label: string;
    value: string;
    onClear: () => void;
}) {
    return (
        <View style={pill.wrap}>
            <Text style={pill.lbl}>{label}</Text>
            <Text style={pill.val}>{value}</Text>
            <TouchableOpacity
                onPress={onClear}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Text style={pill.x}>✕</Text>
            </TouchableOpacity>
        </View>
    );
}
const pill = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.purpleBg,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.purpleLight + "44",
    },
    lbl: { fontSize: 10, fontWeight: "600", color: Colors.text3 },
    val: { fontSize: 12, fontWeight: "700", color: Colors.purple },
    x: { fontSize: 10, color: Colors.text3, fontWeight: "700" },
});

// ─── Error + Retry ───────────────────────────────────────
function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
    return (
        <View
            style={{
                alignItems: "center",
                paddingTop: 60,
                paddingHorizontal: 32,
            }}
        >
            <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
            <Text
                style={{
                    fontSize: 15,
                    fontWeight: "700",
                    color: Colors.text1,
                    marginBottom: 6,
                }}
            >
                Failed to load
            </Text>
            <Text
                style={{
                    fontSize: 13,
                    color: Colors.text3,
                    textAlign: "center",
                    lineHeight: 20,
                    marginBottom: 20,
                }}
            >
                {msg}
            </Text>
            <TouchableOpacity
                style={{
                    backgroundColor: Colors.purple,
                    borderRadius: 12,
                    paddingHorizontal: 28,
                    paddingVertical: 12,
                }}
                onPress={onRetry}
                activeOpacity={0.8}
            >
                <Text
                    style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}
                >
                    Retry
                </Text>
            </TouchableOpacity>
        </View>
    );
}

// ─── Main ────────────────────────────────────────────────
export default function MarksEntryScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [step, setStep] = useState<Step>(1);
    const [sel, setSel] = useState<Partial<Selection>>({});

    // Step 1 — classes list
    const [classes, setClasses] = useState<ClassWithSections[]>([]);
    const [clsLoading, setClsLoading] = useState(true);
    const [clsError, setClsError] = useState("");

    // Step 2 — sections come from the selected class object (already loaded)
    const sections: ClassSection[] =
        classes.find((c) => c.class_id === sel.class_id)?.sections ?? [];

    // Step 3 — exams list
    const [exams, setExams] = useState<ExamItem[]>([]);
    const [exmLoading, setExmLoading] = useState(false);
    const [exmError, setExmError] = useState("");

    // ── Load classes on mount ───────────────────────────────
    const loadClasses = useCallback(async () => {
        if (!user?.token) return;
        setClsLoading(true);
        setClsError("");
        try {
            const res = await getClassSectionList(
                user.token,
                user.record.school_id,
            );

            console.log(res);
            if (res.response_code === 200) {
                setClasses(res.data ?? []);
            } else {
                setClsError(res.response_message || "Could not load classes.");
            }
        } catch (e: any) {
            setClsError(e?.message || "Network error.");
        } finally {
            setClsLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    // ── Load exams when step 3 opens ────────────────────────
    const loadExams = useCallback(
        async (class_id: string, section_id: string) => {
            if (!user?.token || !user.record) return;
            setExmLoading(true);
            setExmError("");
            setExams([]);
            console.log({
                school_id: user.record.school_id,
                session_id: (user.record as any).session_id ?? null, // fallback
                class_id,
                section_id,
            });
            try {
                const res = await getClassExamList(
                    {
                        school_id: user.record.school_id,
                        session_id: (user.record as any).session_id ?? null, // fallback
                        class_id,
                        section_id,
                    },
                    user.token,
                );
                if (res.response_code === 200) {
                    setExams(res.exams ?? []);
                } else {
                    setExmError(res?.message || "Could not load exams.");
                }
            } catch (e: any) {
                setExmError(e?.message || "Network error.");
            } finally {
                setExmLoading(false);
            }
        },
        [user?.token, user?.record],
    );

    // ── Reset helpers ────────────────────────────────────────
    const resetFrom = (s: Step) => {
        if (s <= 1) {
            setSel({});
            setExams([]);
        } else if (s <= 2) {
            setSel((p) => ({ class_id: p.class_id, class_name: p.class_name }));
            setExams([]);
        }
        setStep(s);
    };

    // ── Select class ────────────────────────────────────────
    const pickClass = (cls: ClassWithSections) => {
        setSel({ class_id: cls.class_id, class_name: cls.class_name });
        setStep(2);
    };

    // ── Select section ──────────────────────────────────────
    const pickSection = (sec: ClassSection) => {
        const updated = {
            ...sel,
            section_id: sec.section_id,
            section_name: sec.section_name,
        };
        setSel(updated);
        setStep(3);
        loadExams(updated.class_id!, sec.section_id);
    };

    // ── Select exam ─────────────────────────────────────────
    const pickExam = (exam: ExamItem) => {
        router.push({
            pathname: "/screens/marks-students",
            params: {
                class_id: sel.class_id!,
                class_name: sel.class_name!,
                section_id: sel.section_id!,
                section_name: sel.section_name!,
                exam_id: exam.exam_id,
                exam_name: exam.exam_name,
            },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
            {/* ── Purple Header ── */}
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
                        <Text style={styles.title}>Marks Entry</Text>
                        <Text style={styles.sub}>
                            Enter student exam scores
                        </Text>
                    </View>
                </View>

                {/* Step bar */}
                <StepBar current={step} />

                {/* Breadcrumb pills */}
                {(sel.class_name || sel.section_name) && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            gap: 8,
                            paddingBottom: 12,
                            paddingRight: 4,
                        }}
                    >
                        {sel.class_name && (
                            <Pill
                                label="Class"
                                value={sel.class_name}
                                onClear={() => resetFrom(1)}
                            />
                        )}
                        {sel.section_name && (
                            <Pill
                                label="Section"
                                value={sel.section_name}
                                onClear={() => resetFrom(2)}
                            />
                        )}
                    </ScrollView>
                )}
            </LinearGradient>

            {/* ── Content ── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: Spacing.lg,
                    paddingBottom: 40,
                }}
            >
                {/* ════ STEP 1 — SELECT CLASS ════ */}
                {step === 1 && (
                    <>
                        <Text style={styles.stepTitle}>Select Class</Text>
                        <Text style={styles.stepSub}>
                            Choose the class to enter marks for
                        </Text>

                        {clsLoading ? (
                            <View style={styles.center}>
                                <ActivityIndicator
                                    color={Colors.purple}
                                    size="large"
                                />
                                <Text style={styles.loadTxt}>
                                    Loading classes…
                                </Text>
                            </View>
                        ) : clsError ? (
                            <ErrorState msg={clsError} onRetry={loadClasses} />
                        ) : classes.length === 0 ? (
                            <View style={styles.center}>
                                <Text
                                    style={{ fontSize: 36, marginBottom: 10 }}
                                >
                                    📭
                                </Text>
                                <Text
                                    style={{
                                        color: Colors.text3,
                                        fontSize: 14,
                                    }}
                                >
                                    No classes found
                                </Text>
                            </View>
                        ) : (
                            classes.map((cls, i) => (
                                <TouchableOpacity
                                    key={cls.class_id}
                                    style={[
                                        styles.classCard,
                                        {
                                            borderLeftColor:
                                                ACCENT[i % ACCENT.length],
                                        },
                                    ]}
                                    onPress={() => pickClass(cls)}
                                    activeOpacity={0.78}
                                >
                                    <View
                                        style={[
                                            styles.classIcon,
                                            {
                                                backgroundColor:
                                                    ACCENT[i % ACCENT.length] +
                                                    "18",
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.classLetter,
                                                {
                                                    color: ACCENT[
                                                        i % ACCENT.length
                                                    ],
                                                    paddingHorizontal: 5,
                                                },
                                            ]}
                                            numberOfLines={1}
                                            adjustsFontSizeToFit
                                        >
                                            {cls.class_name}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.className}>
                                            Class {cls.class_name}
                                        </Text>
                                        <Text style={styles.classSub}>
                                            {cls.sections.length} section
                                            {cls.sections.length !== 1
                                                ? "s"
                                                : ""}
                                            {" · "}
                                            {cls.sections
                                                .map((s) => s.section_name)
                                                .join(", ")}
                                        </Text>
                                    </View>
                                    <Text style={styles.chevron}>›</Text>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}

                {/* ════ STEP 2 — SELECT SECTION ════ */}
                {step === 2 && (
                    <>
                        <Text style={styles.stepTitle}>Select Section</Text>
                        <Text style={styles.stepSub}>
                            Class {sel.class_name} — choose a section
                        </Text>

                        <View style={styles.secGrid}>
                            {sections.map((sec, i) => (
                                <TouchableOpacity
                                    key={sec.section_id}
                                    style={[
                                        styles.secCard,
                                        {
                                            backgroundColor:
                                                ACCENT[i % ACCENT.length] +
                                                "13",
                                            borderColor:
                                                ACCENT[i % ACCENT.length] +
                                                "40",
                                        },
                                    ]}
                                    onPress={() => pickSection(sec)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.secLetter,
                                            {
                                                color: ACCENT[
                                                    i % ACCENT.length
                                                ],
                                                paddingHorizontal: 5,
                                                width: "70%",
                                                textAlign: "center",
                                                height: 35,
                                                textAlignVertical: "center",
                                            },
                                        ]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                    >
                                        {sec.section_name}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.secLabel,
                                            {
                                                color: ACCENT[
                                                    i % ACCENT.length
                                                ],
                                            },
                                        ]}
                                    >
                                        Section
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}

                {/* ════ STEP 3 — SELECT EXAM ════ */}
                {step === 3 && (
                    <>
                        <Text style={styles.stepTitle}>Select Exam</Text>
                        <Text style={styles.stepSub}>
                            Class {sel.class_name}-{sel.section_name} — choose
                            an exam
                        </Text>

                        {exmLoading ? (
                            <View style={styles.center}>
                                <ActivityIndicator
                                    color={Colors.purple}
                                    size="large"
                                />
                                <Text style={styles.loadTxt}>
                                    Loading exams…
                                </Text>
                            </View>
                        ) : exmError ? (
                            <ErrorState
                                msg={exmError}
                                onRetry={() =>
                                    loadExams(sel.class_id!, sel.section_id!)
                                }
                            />
                        ) : exams.length === 0 ? (
                            <View style={styles.center}>
                                <Text
                                    style={{ fontSize: 36, marginBottom: 10 }}
                                >
                                    📭
                                </Text>
                                <Text
                                    style={{
                                        color: Colors.text3,
                                        fontSize: 14,
                                    }}
                                >
                                    No exams found for this class
                                </Text>
                            </View>
                        ) : (
                            exams.map((exam, i) => (
                                <TouchableOpacity
                                    key={exam.exam_id}
                                    style={[
                                        styles.examCard,
                                        {
                                            borderLeftColor:
                                                ACCENT[i % ACCENT.length],
                                        },
                                    ]}
                                    onPress={() => pickExam(exam)}
                                    activeOpacity={0.78}
                                >
                                    <View
                                        style={[
                                            styles.examIcon,
                                            {
                                                backgroundColor:
                                                    ACCENT[i % ACCENT.length] +
                                                    "18",
                                            },
                                        ]}
                                    >
                                        <Text style={{ fontSize: 20 }}>📝</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.examName}>
                                            {exam.exam_name}
                                        </Text>
                                        <Text style={styles.examId}>
                                            Exam ID: {exam.exam_id}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.examBadge,
                                            {
                                                backgroundColor:
                                                    ACCENT[i % ACCENT.length] +
                                                    "18",
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.examBadgeTxt,
                                                {
                                                    color: ACCENT[
                                                        i % ACCENT.length
                                                    ],
                                                },
                                            ]}
                                        >
                                            Enter Marks
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.sm,
        position: "relative",
        overflow: "hidden",
    },
    decor1: {
        position: "absolute",
        top: -50,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    decor2: {
        position: "absolute",
        bottom: -40,
        left: -20,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 2,
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
    title: { fontSize: 20, fontWeight: "800", color: "#fff" },
    sub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },

    stepTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: Colors.text1,
        marginBottom: 4,
    },
    stepSub: { fontSize: 13, color: Colors.text3, marginBottom: 16 },

    center: { alignItems: "center", paddingTop: 50, gap: 10 },
    loadTxt: { fontSize: 14, color: Colors.text3, marginTop: 10 },

    // Class cards
    classCard: {
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        ...Shadow.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        borderLeftWidth: 4,
        marginBottom: 8,
    },
    classIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    classLetter: { fontSize: 20, fontWeight: "900" },
    className: { fontSize: 15, fontWeight: "700", color: Colors.text1 },
    classSub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
    chevron: { fontSize: 22, color: Colors.text3 },

    // Section grid
    secGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    secCard: {
        width: "28%",
        aspectRatio: 1,
        borderRadius: Radius.xl,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        ...Shadow.sm,
    },
    secLetter: { fontSize: 26, fontWeight: "900" },
    secLabel: { fontSize: 10, fontWeight: "600", marginTop: 3 },

    // Exam cards
    examCard: {
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
        ...Shadow.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        borderLeftWidth: 4,
    },
    examIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    examName: { fontSize: 15, fontWeight: "800", color: Colors.text1 },
    examId: { fontSize: 12, color: Colors.text3, marginTop: 2 },
    examBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    examBadgeTxt: { fontSize: 11, fontWeight: "700" },
});
