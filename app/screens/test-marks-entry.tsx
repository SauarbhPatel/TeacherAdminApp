/**
 * test-marks-entry.tsx
 *
 * 3-step selector: Class → Section → Subject + Date
 * Then navigates to test-marks-students screen.
 * Teal/indigo accent to differentiate from other entry screens.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getClassSectionList, getSubjectsByClassSection } from "@/services/api";
import { ClassWithSections, ClassSection, SubjectItem } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

type Step = 1 | 2 | 3;

const ACCENT_COLOR = "#0f766e"; // teal-700
const ACCENT_LIGHT = Colors.teal;
const ACCENT_BG = Colors.tealBg;

const ACCENT = [
    ACCENT_LIGHT,
    Colors.purple,
    Colors.blue,
    Colors.amber,
    Colors.green,
    Colors.pink,
    "#7c3aed",
    "#0891b2",
    "#d97706",
];

function todayISO(): string {
    return new Date().toISOString().split("T")[0];
}
function formatDisplay(iso: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

// ─── StepBar (3 steps) ───────────────────────────────────
function StepBar({ current }: { current: Step }) {
    const steps = [
        { n: 1, label: "Class" },
        { n: 2, label: "Section" },
        { n: 3, label: "Subject & Date" },
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
    numActive: { color: ACCENT_COLOR },
    lbl: {
        fontSize: 9,
        fontWeight: "600",
        color: "rgba(255,255,255,0.55)",
        textAlign: "center",
    },
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

// ─── Pill ─────────────────────────────────────────────────
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
        backgroundColor: ACCENT_BG,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: ACCENT_LIGHT + "44",
    },
    lbl: { fontSize: 10, fontWeight: "600", color: Colors.text3 },
    val: { fontSize: 12, fontWeight: "700", color: ACCENT_LIGHT },
    x: { fontSize: 10, color: Colors.text3, fontWeight: "700" },
});

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
                    backgroundColor: ACCENT_LIGHT,
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

export default function TestMarksEntryScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [step, setStep] = useState<Step>(1);
    const [selClassId, setSelClassId] = useState("");
    const [selClassName, setSelClassName] = useState("");
    const [selSectionId, setSelSectionId] = useState("");
    const [selSectionName, setSelSectionName] = useState("");

    const [classes, setClasses] = useState<ClassWithSections[]>([]);
    const [clsLoading, setClsLoading] = useState(true);
    const [clsError, setClsError] = useState("");
    const sections: ClassSection[] =
        classes.find((c) => c.class_id === selClassId)?.sections ?? [];

    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [subLoading, setSubLoading] = useState(false);
    const [subError, setSubError] = useState("");

    // Step 3 state
    const [selSubjectId, setSelSubjectId] = useState("");
    const [selSubjectName, setSelSubjectName] = useState("");
    const [examDate, setExamDate] = useState(todayISO());

    // ── Load classes ─────────────────────────────────────────
    const loadClasses = useCallback(async () => {
        if (!user?.token) return;
        setClsLoading(true);
        setClsError("");
        try {
            const res = await getClassSectionList(
                user.token,
                user.record.school_id,
            );
            if (res.response_code === 200) setClasses(res.data ?? []);
            else setClsError(res.response_message || "Could not load classes.");
        } catch (e: any) {
            setClsError(e?.message || "Network error.");
        } finally {
            setClsLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        loadClasses();
    }, [loadClasses]);

    // ── Load subjects ────────────────────────────────────────
    const loadSubjects = useCallback(
        async (cid: string, sid: string) => {
            if (!user?.token || !user.record) return;
            setSubLoading(true);
            setSubError("");
            setSubjects([]);
            try {
                const res = await getSubjectsByClassSection(
                    {
                        school_id: user.record.school_id,
                        session_id: (user.record as any).session_id ?? 22,
                        class_id: cid,
                        section_id: sid,
                    },
                    user.token,
                );
                if (res.response_code === 200) setSubjects(res.subjects ?? []);
                else
                    setSubError(
                        res.response_message || "Could not load subjects.",
                    );
            } catch (e: any) {
                setSubError(e?.message || "Network error.");
            } finally {
                setSubLoading(false);
            }
        },
        [user?.token, user?.record],
    );

    const resetFrom = (s: Step) => {
        if (s <= 1) {
            setSelClassId("");
            setSelClassName("");
            setSelSectionId("");
            setSelSectionName("");
            setSubjects([]);
            setSelSubjectId("");
            setSelSubjectName("");
        } else if (s <= 2) {
            setSelSectionId("");
            setSelSectionName("");
            setSubjects([]);
            setSelSubjectId("");
            setSelSubjectName("");
        } else {
            setSelSubjectId("");
            setSelSubjectName("");
        }
        setStep(s);
    };

    const pickClass = (cls: ClassWithSections) => {
        setSelClassId(cls.class_id);
        setSelClassName(cls.class_name);
        setStep(2);
    };

    const pickSection = (sec: ClassSection) => {
        setSelSectionId(sec.section_id);
        setSelSectionName(sec.section_name);
        setStep(3);
        loadSubjects(selClassId, sec.section_id);
    };

    const pickSubject = (sub: SubjectItem) => {
        setSelSubjectId(sub.subject_master_id);
        setSelSubjectName(sub.subject_name);
    };

    const handleProceed = () => {
        if (!selSubjectId) return;
        if (!examDate) return;
        router.push({
            pathname: "/screens/test-marks-students" as any,
            params: {
                class_id: selClassId,
                class_name: selClassName,
                section_id: selSectionId,
                section_name: selSectionName,
                subject_master_id: selSubjectId,
                subject_name: selSubjectName,
                exam_date: examDate,
            },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
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
                        <Text style={styles.title}>Test Marks Entry</Text>
                        <Text style={styles.sub}>
                            Class test / unit test scores
                        </Text>
                    </View>
                </View>
                <StepBar current={step} />
                {(selClassName || selSectionName || selSubjectName) && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            gap: 8,
                            paddingBottom: 12,
                            paddingRight: 4,
                        }}
                    >
                        {selClassName && (
                            <Pill
                                label="Class"
                                value={selClassName}
                                onClear={() => resetFrom(1)}
                            />
                        )}
                        {selSectionName && (
                            <Pill
                                label="Section"
                                value={selSectionName}
                                onClear={() => resetFrom(2)}
                            />
                        )}
                        {selSubjectName && (
                            <Pill
                                label="Subject"
                                value={selSubjectName}
                                onClear={() => resetFrom(3)}
                            />
                        )}
                    </ScrollView>
                )}
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: Spacing.lg,
                    paddingBottom: 40,
                }}
            >
                {/* ── STEP 1: Class ── */}
                {step === 1 && (
                    <>
                        <Text style={styles.stepTitle}>Select Class</Text>
                        <Text style={styles.stepSub}>
                            Choose a class for test marks entry
                        </Text>
                        {clsLoading ? (
                            <View style={styles.center}>
                                <ActivityIndicator
                                    color={ACCENT_LIGHT}
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
                                <Text style={{ color: Colors.text3 }}>
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
                                                : ""}{" "}
                                            ·{" "}
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

                {/* ── STEP 2: Section ── */}
                {step === 2 && (
                    <>
                        <Text style={styles.stepTitle}>Select Section</Text>
                        <Text style={styles.stepSub}>
                            Class {selClassName} — choose a section
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

                {/* ── STEP 3: Subject + Date ── */}
                {step === 3 && (
                    <>
                        <Text style={styles.stepTitle}>
                            Select Subject & Date
                        </Text>
                        <Text style={styles.stepSub}>
                            Class {selClassName}-{selSectionName}
                        </Text>

                        {/* Date picker */}
                        <View style={styles.dateCard}>
                            <Text style={styles.dateLabel}>
                                📅 Test / Exam Date *
                            </Text>
                            <View style={styles.dateRow}>
                                <TextInput
                                    style={styles.dateInput}
                                    value={examDate}
                                    onChangeText={setExamDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={Colors.text3}
                                    keyboardType="numeric"
                                    maxLength={10}
                                />
                                {examDate ? (
                                    <View style={styles.dateBadge}>
                                        <Text style={styles.dateBadgeTxt}>
                                            {formatDisplay(examDate)}
                                        </Text>
                                    </View>
                                ) : null}
                            </View>
                        </View>

                        {/* Subject list */}
                        <Text
                            style={[
                                styles.stepTitle,
                                { fontSize: 14, marginTop: 4 },
                            ]}
                        >
                            Select Subject
                        </Text>
                        {subLoading ? (
                            <View style={styles.center}>
                                <ActivityIndicator
                                    color={ACCENT_LIGHT}
                                    size="large"
                                />
                                <Text style={styles.loadTxt}>
                                    Loading subjects…
                                </Text>
                            </View>
                        ) : subError ? (
                            <ErrorState
                                msg={subError}
                                onRetry={() =>
                                    loadSubjects(selClassId, selSectionId)
                                }
                            />
                        ) : subjects.length === 0 ? (
                            <View style={styles.center}>
                                <Text
                                    style={{ fontSize: 36, marginBottom: 10 }}
                                >
                                    📭
                                </Text>
                                <Text style={{ color: Colors.text3 }}>
                                    No subjects found
                                </Text>
                            </View>
                        ) : (
                            subjects.map((sub, i) => {
                                const isActive =
                                    selSubjectId === sub.subject_master_id;
                                const ac = ACCENT[i % ACCENT.length];
                                return (
                                    <TouchableOpacity
                                        key={sub.subject_master_id}
                                        style={[
                                            styles.subjectCard,
                                            { borderLeftColor: ac },
                                            isActive && {
                                                backgroundColor: ac + "10",
                                                borderColor: ac + "60",
                                            },
                                        ]}
                                        onPress={() => pickSubject(sub)}
                                        activeOpacity={0.78}
                                    >
                                        <View
                                            style={[
                                                styles.subjectIcon,
                                                {
                                                    backgroundColor: isActive
                                                        ? ac + "25"
                                                        : ac + "18",
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.subjectInitial,
                                                    { color: ac },
                                                ]}
                                            >
                                                {sub.subject_name[0]}
                                            </Text>
                                        </View>
                                        <Text
                                            style={[
                                                styles.subjectName,
                                                isActive && { color: ac },
                                            ]}
                                        >
                                            {sub.subject_name}
                                        </Text>
                                        {isActive && (
                                            <View
                                                style={[
                                                    styles.selBadge,
                                                    { backgroundColor: ac },
                                                ]}
                                            >
                                                <Text
                                                    style={styles.selBadgeTxt}
                                                >
                                                    ✓ Selected
                                                </Text>
                                            </View>
                                        )}
                                        {!isActive && (
                                            <Text style={styles.chevron}>
                                                ›
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })
                        )}

                        {/* Proceed button */}
                        <TouchableOpacity
                            style={[
                                styles.proceedBtn,
                                (!selSubjectId || !examDate) && {
                                    opacity: 0.45,
                                },
                            ]}
                            onPress={handleProceed}
                            disabled={!selSubjectId || !examDate}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={[ACCENT_LIGHT, ACCENT_COLOR]}
                                style={styles.proceedGrad}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.proceedTxt}>
                                    View Students & Enter Marks →
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
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
    classLetter: { fontSize: 18, fontWeight: "900", paddingHorizontal: 4 },
    className: { fontSize: 15, fontWeight: "700", color: Colors.text1 },
    classSub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
    chevron: { fontSize: 22, color: Colors.text3 },
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
    secLetter: { fontSize: 22, fontWeight: "900" },
    secLabel: { fontSize: 10, fontWeight: "600", marginTop: 3 },
    // Date card
    dateCard: {
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        ...Shadow.sm,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 20,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.text2,
        marginBottom: 10,
    },
    dateRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    dateInput: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 15,
        fontWeight: "700",
        color: Colors.text1,
    },
    dateBadge: {
        backgroundColor: ACCENT_BG,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    dateBadgeTxt: { fontSize: 12, fontWeight: "800", color: ACCENT_LIGHT },
    // Subject cards
    subjectCard: {
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
    subjectIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    subjectInitial: { fontSize: 16, fontWeight: "900" },
    subjectName: {
        flex: 1,
        fontSize: 15,
        fontWeight: "700",
        color: Colors.text1,
    },
    selBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    selBadgeTxt: { fontSize: 11, fontWeight: "800", color: "#fff" },
    // Proceed
    proceedBtn: {
        marginTop: 24,
        borderRadius: Radius.lg,
        overflow: "hidden",
        ...Shadow.sm,
    },
    proceedGrad: { paddingVertical: 16, alignItems: "center" },
    proceedTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
