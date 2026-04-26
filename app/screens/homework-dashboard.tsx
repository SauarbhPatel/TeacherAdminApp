/**
 * homework-dashboard.tsx
 *
 * Step 1 → Select Class (grouped from getHomeworkStaff response)
 * Step 2 → Select Section → navigates to homework-entry screen
 *
 * Uses getHomeworkStaff to build class→section tree.
 * Green accent (homework brand colour).
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getHomeworkStaff } from "@/services/api";
import { HomeworkDashboardItem } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

type Step = 1 | 2;

const ACCENT = [
    Colors.green,
    Colors.purple,
    Colors.blue,
    Colors.amber,
    Colors.pink,
    Colors.teal,
    "#7c3aed",
    "#0891b2",
    "#d97706",
];

// ─── StepBar (2 steps only) ───────────────────────────────
function StepBar({ current }: { current: Step }) {
    const steps = [
        { n: 1, label: "Class" },
        { n: 2, label: "Section" },
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
                        {i < 1 && (
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
    numActive: { color: Colors.green },
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

// ─── Pill breadcrumb ──────────────────────────────────────
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
        backgroundColor: Colors.greenBg,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: Colors.green + "44",
    },
    lbl: { fontSize: 10, fontWeight: "600", color: Colors.text3 },
    val: { fontSize: 12, fontWeight: "700", color: Colors.green },
    x: { fontSize: 10, color: Colors.text3, fontWeight: "700" },
});

// ─── Grouped class type ───────────────────────────────────
interface ClassGroup {
    class_id: string;
    class_name: string;
    sections: HomeworkDashboardItem[];
}

export default function HomeworkDashboardScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [step, setStep] = useState<Step>(1);
    const [selClass, setSelClass] = useState<ClassGroup | null>(null);
    const [data, setData] = useState<HomeworkDashboardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // ── Fetch dashboard ──────────────────────────────────────
    const fetchData = useCallback(
        async (silent = false) => {
            if (!user?.token || !user.record) return;
            if (!silent) {
                setLoading(true);
                setError("");
            }
            try {
                const res = await getHomeworkStaff(
                    {
                        school_id: user.record.school_id,
                        session_id: (user.record as any).session_id ?? 22,
                    },
                    user.token,
                );
                if (res.response_code === 200) {
                    setData(res.data ?? []);
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
        [user?.token, user?.record],
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    // ── Group by class ───────────────────────────────────────
    const classGroups: ClassGroup[] = useMemo(() => {
        const map: Record<string, ClassGroup> = {};
        data.forEach((item) => {
            if (!map[item.class_id]) {
                map[item.class_id] = {
                    class_id: item.class_id,
                    class_name: item.class_name,
                    sections: [],
                };
            }
            map[item.class_id].sections.push(item);
        });
        return Object.values(map);
    }, [data]);

    const pickClass = (cls: ClassGroup) => {
        setSelClass(cls);
        setStep(2);
    };
    const resetClass = () => {
        setSelClass(null);
        setStep(1);
    };

    const pickSection = (item: HomeworkDashboardItem) => {
        router.push({
            pathname: "/screens/homework-entry" as any,
            params: {
                class_id: item.class_id,
                class_name: item.class_name,
                section_id: item.section_id,
                section_name: item.section_name,
                all_sections: JSON.stringify(
                    selClass!.sections.map((s) => ({
                        section_id: s.section_id,
                        section_name: s.section_name,
                    })),
                ),
                existing_homework: JSON.stringify(item.homework),
            },
        });
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
            <LinearGradient
                colors={[Colors.green, "#0a8a50"]}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                <View style={styles.decor1} />
                <View style={styles.decor2} />
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() =>
                            !router.canGoBack()
                                ? router.replace("tabs")
                                : router.back()
                        }
                        activeOpacity={0.75}
                    >
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.title}>Homework</Text>
                        <Text style={styles.sub}>
                            {loading
                                ? "Loading…"
                                : `${classGroups.length} classes · ${data.length} sections`}
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
                        <Text style={{ fontSize: 16, color: "#fff" }}>↻</Text>
                    </TouchableOpacity>
                </View>
                <StepBar current={step} />
                {selClass && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{
                            gap: 8,
                            paddingBottom: 12,
                            paddingRight: 4,
                        }}
                    >
                        <Pill
                            label="Class"
                            value={selClass.class_name}
                            onClear={resetClass}
                        />
                    </ScrollView>
                )}
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color={Colors.green} size="large" />
                    <Text style={styles.loadTxt}>Loading homework…</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={{ fontSize: 36, marginBottom: 12 }}>⚠️</Text>
                    <Text style={styles.errTitle}>Failed to load</Text>
                    <Text style={styles.errMsg}>{error}</Text>
                    <TouchableOpacity
                        style={[
                            styles.retryBtn,
                            { backgroundColor: Colors.green },
                        ]}
                        onPress={() => fetchData()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryTxt}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        padding: Spacing.lg,
                        paddingBottom: 40,
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.green}
                        />
                    }
                >
                    {/* ── STEP 1: Class list ── */}
                    {step === 1 && (
                        <>
                            <Text style={styles.stepTitle}>Select Class</Text>
                            <Text style={styles.stepSub}>
                                Choose a class to add or view homework
                            </Text>
                            {classGroups.length === 0 ? (
                                <View style={styles.center}>
                                    <Text
                                        style={{
                                            fontSize: 36,
                                            marginBottom: 10,
                                        }}
                                    >
                                        📭
                                    </Text>
                                    <Text style={{ color: Colors.text3 }}>
                                        No classes found
                                    </Text>
                                </View>
                            ) : (
                                classGroups.map((cls, i) => {
                                    const totalHw = cls.sections.reduce(
                                        (sum, s) => sum + s.homework.length,
                                        0,
                                    );
                                    const filledHw = cls.sections.reduce(
                                        (sum, s) =>
                                            sum +
                                            s.homework.filter(
                                                (h) => h.description,
                                            ).length,
                                        0,
                                    );
                                    const accent = ACCENT[i % ACCENT.length];
                                    return (
                                        <TouchableOpacity
                                            key={cls.class_id}
                                            style={[
                                                styles.classCard,
                                                { borderLeftColor: accent },
                                            ]}
                                            onPress={() => pickClass(cls)}
                                            activeOpacity={0.78}
                                        >
                                            <View
                                                style={[
                                                    styles.classIcon,
                                                    {
                                                        backgroundColor:
                                                            accent + "18",
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.classLetter,
                                                        { color: accent },
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
                                                    {cls.sections.length}{" "}
                                                    section
                                                    {cls.sections.length !== 1
                                                        ? "s"
                                                        : ""}
                                                </Text>
                                            </View>
                                            {/* Homework filled badge */}
                                            <View
                                                style={[
                                                    styles.hwBadge,
                                                    {
                                                        backgroundColor:
                                                            accent + "18",
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.hwBadgeTxt,
                                                        { color: accent },
                                                    ]}
                                                >
                                                    {filledHw}/{totalHw}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.hwBadgeLbl,
                                                        { color: accent },
                                                    ]}
                                                >
                                                    filled
                                                </Text>
                                            </View>
                                            <Text style={styles.chevron}>
                                                ›
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })
                            )}
                        </>
                    )}

                    {/* ── STEP 2: Section list ── */}
                    {step === 2 && selClass && (
                        <>
                            <Text style={styles.stepTitle}>Select Section</Text>
                            <Text style={styles.stepSub}>
                                Class {selClass.class_name} — choose a section
                            </Text>
                            {selClass.sections.map((item, i) => {
                                const accent = ACCENT[i % ACCENT.length];
                                const hwCount = item.homework.length;
                                const filledCount = item.homework.filter(
                                    (h) => h.description,
                                ).length;
                                const allFilled =
                                    hwCount > 0 && filledCount === hwCount;
                                const noneFilled = filledCount === 0;
                                return (
                                    <TouchableOpacity
                                        key={item.section_id}
                                        style={[
                                            styles.sectionCard,
                                            { borderLeftColor: accent },
                                        ]}
                                        onPress={() => pickSection(item)}
                                        activeOpacity={0.78}
                                    >
                                        {/* Section letter circle */}
                                        <View
                                            style={[
                                                styles.secCircle,
                                                {
                                                    backgroundColor:
                                                        accent + "18",
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.secLetter,
                                                    { color: accent },
                                                ]}
                                                numberOfLines={1}
                                                adjustsFontSizeToFit
                                            >
                                                {item.section_name}
                                            </Text>
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.secName}>
                                                Section {item.section_name}
                                            </Text>
                                            {/* Subject chips */}
                                            <ScrollView
                                                horizontal
                                                showsHorizontalScrollIndicator={
                                                    false
                                                }
                                                contentContainerStyle={{
                                                    gap: 4,
                                                    marginTop: 5,
                                                }}
                                            >
                                                {item.homework.map((hw) => (
                                                    <View
                                                        key={hw.id}
                                                        style={[
                                                            styles.subjectPill,
                                                            {
                                                                backgroundColor:
                                                                    hw.description
                                                                        ? Colors.greenBg
                                                                        : Colors.surface,
                                                                borderColor:
                                                                    hw.description
                                                                        ? Colors.green +
                                                                          "60"
                                                                        : Colors.border,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.subjectPillTxt,
                                                                {
                                                                    color: hw.description
                                                                        ? Colors.green
                                                                        : Colors.text3,
                                                                },
                                                            ]}
                                                        >
                                                            {hw.description
                                                                ? "✓ "
                                                                : ""}
                                                            {hw.subject_name}
                                                        </Text>
                                                    </View>
                                                ))}
                                                {hwCount === 0 && (
                                                    <Text
                                                        style={{
                                                            color: Colors.text3,
                                                            fontSize: 11,
                                                        }}
                                                    >
                                                        No subjects assigned
                                                    </Text>
                                                )}
                                            </ScrollView>
                                        </View>

                                        {/* Status badge */}
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                {
                                                    backgroundColor: allFilled
                                                        ? Colors.greenBg
                                                        : noneFilled
                                                          ? Colors.surface
                                                          : Colors.amberBg,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusTxt,
                                                    {
                                                        color: allFilled
                                                            ? Colors.greenText
                                                            : noneFilled
                                                              ? Colors.text3
                                                              : Colors.amberText,
                                                    },
                                                ]}
                                            >
                                                {allFilled
                                                    ? "Done"
                                                    : noneFilled
                                                      ? "Empty"
                                                      : `${filledCount}/${hwCount}`}
                                            </Text>
                                        </View>
                                        <Text style={styles.chevron}>›</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </>
                    )}
                </ScrollView>
            )}
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
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
        gap: 10,
    },
    loadTxt: { fontSize: 14, color: Colors.text3, marginTop: 10 },
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
        marginBottom: 16,
    },
    retryBtn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
    retryTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
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
    classLetter: { fontSize: 18, fontWeight: "900", paddingHorizontal: 4 },
    className: { fontSize: 15, fontWeight: "700", color: Colors.text1 },
    classSub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
    hwBadge: {
        alignItems: "center",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    hwBadgeTxt: { fontSize: 13, fontWeight: "900" },
    hwBadgeLbl: { fontSize: 8, fontWeight: "600" },
    chevron: { fontSize: 22, color: Colors.text3 },
    // Section cards
    sectionCard: {
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
        marginBottom: 10,
    },
    secCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    secLetter: { fontSize: 16, fontWeight: "900" },
    secName: { fontSize: 14, fontWeight: "700", color: Colors.text1 },
    subjectPill: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    subjectPillTxt: { fontSize: 10, fontWeight: "700" },
    statusBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexShrink: 0,
    },
    statusTxt: { fontSize: 11, fontWeight: "800" },
});
