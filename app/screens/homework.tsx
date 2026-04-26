import React, { useState, useCallback, useEffect } from "react";
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
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

// ─── Types ───────────────────────────────────────────────
interface HomeworkItem {
    id: string;
    subject_id: string;
    subject_name: string;
    homework_date: string | null;
    from_date: string | null;
    to_date: string | null;
    submit_date: string | null;
    description: string | null;
    document: string | null;
    image: string | null;
    class_id: string;
    section_id: string;
}

interface SectionData {
    date: string;
    class_id: string;
    class_name: string;
    section_id: string;
    section_name: string;
    homework: HomeworkItem[];
}

interface ClassGroup {
    class_id: string;
    class_name: string;
    sections: SectionData[];
}

// ─── Helpers ─────────────────────────────────────────────
function groupByClass(data: SectionData[]): ClassGroup[] {
    const map: Record<string, ClassGroup> = {};
    data.forEach((d) => {
        if (!map[d.class_id]) {
            map[d.class_id] = {
                class_id: d.class_id,
                class_name: d.class_name,
                sections: [],
            };
        }
        map[d.class_id].sections.push(d);
    });
    return Object.values(map);
}

function hasFilled(s: SectionData) {
    return s.homework.some((h) => h.description);
}

// ─── Screen ──────────────────────────────────────────────
export default function HomeworkScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [allData, setAllData] = useState<SectionData[]>([]);

    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
        null,
    );

    const schoolId = user?.record?.school_id ?? "131";
    const sessionId = (user?.record as any)?.session_id ?? 22;

    // ── Fetch ─────────────────────────────────────────────
    const fetchDashboard = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        setError("");
        try {
            const res = await fetch(
                "https://edumug.in/api/webservice/getHomeworkStaff",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        school_id: parseInt(schoolId),
                        session_id: sessionId,
                    }),
                },
            );
            const json = await res.json();
            if (json.response_code === 200) {
                const data: SectionData[] = json.data ?? [];
                setAllData(data);
                setClasses(groupByClass(data));
            } else {
                setError(json.response_message || "Failed to load");
            }
        } catch (e: any) {
            setError(e?.message || "Network error");
        } finally {
            setLoading(false);
        }
    }, [user?.token, schoolId, sessionId]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    // ── Derived ───────────────────────────────────────────
    const selectedClass =
        classes.find((c) => c.class_id === selectedClassId) ?? null;

    const handleClassSelect = (classId: string) => {
        setSelectedClassId(classId);
        setSelectedSectionId(null);
    };

    const handleSectionSelect = (sectionId: string) => {
        setSelectedSectionId(sectionId);
    };

    const handleProceed = () => {
        if (!selectedClassId || !selectedSectionId) return;
        const sectionData = allData.find(
            (d) =>
                d.class_id === selectedClassId &&
                d.section_id === selectedSectionId,
        );
        router.push({
            pathname: "/screens/add-homework",
            params: {
                sectionData: JSON.stringify(sectionData),
                school_id: schoolId,
                session_id: String(sessionId),
            },
        } as any);
    };

    // ── Render ────────────────────────────────────────────
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: Colors.surface,
                paddingTop: insets.top,
            }}
        >
            {/* Header */}
            <LinearGradient
                colors={[Colors.purple, Colors.purpleDeeper]}
                style={styles.header}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
            >
                <View style={styles.decorCircle1} />
                <View style={styles.decorCircle2} />
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                    activeOpacity={0.75}
                >
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Homework</Text>
                <Text style={styles.headerSub}>
                    Select class & section to manage
                </Text>
            </LinearGradient>

            {/* Step pills */}
            <View style={styles.stepRow}>
                <View style={[styles.stepPill, styles.stepPillDone]}>
                    <Text style={[styles.stepText, styles.stepTextDone]}>
                        1 · Class
                    </Text>
                </View>
                <Text style={styles.stepArrow}>›</Text>
                <View
                    style={[
                        styles.stepPill,
                        selectedClassId ? styles.stepPillDone : {},
                    ]}
                >
                    <Text
                        style={[
                            styles.stepText,
                            selectedClassId ? styles.stepTextDone : {},
                        ]}
                    >
                        2 · Section
                    </Text>
                </View>
                <Text style={styles.stepArrow}>›</Text>
                <View
                    style={[
                        styles.stepPill,
                        selectedSectionId ? styles.stepPillDone : {},
                    ]}
                >
                    <Text
                        style={[
                            styles.stepText,
                            selectedSectionId ? styles.stepTextDone : {},
                        ]}
                    >
                        3 · Homework
                    </Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.purple} />
                    <Text style={styles.loadTxt}>Loading classes…</Text>
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorTxt}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={fetchDashboard}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryTxt}>↻ Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        padding: Spacing.lg,
                        paddingBottom: 120,
                    }}
                >
                    {/* CLASS SELECT */}
                    <Text style={styles.sectionLabel}>Choose Class</Text>
                    <View style={styles.chipRow}>
                        {classes.map((c) => (
                            <TouchableOpacity
                                key={c.class_id}
                                style={[
                                    styles.classChip,
                                    selectedClassId === c.class_id &&
                                        styles.classChipActive,
                                ]}
                                onPress={() => handleClassSelect(c.class_id)}
                                activeOpacity={0.75}
                            >
                                <Text
                                    style={[
                                        styles.classChipText,
                                        selectedClassId === c.class_id &&
                                            styles.classChipTextActive,
                                    ]}
                                >
                                    {c.class_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* SECTION SELECT */}
                    {selectedClass && (
                        <>
                            <Text
                                style={[
                                    styles.sectionLabel,
                                    { marginTop: Spacing.xl },
                                ]}
                            >
                                Choose Section
                                <Text style={styles.legendTxt}>
                                    {" "}
                                    ● filled ○ empty
                                </Text>
                            </Text>
                            <View style={styles.chipRow}>
                                {selectedClass.sections.map((s) => {
                                    const filled = hasFilled(s);
                                    const active =
                                        selectedSectionId === s.section_id;
                                    return (
                                        <TouchableOpacity
                                            key={s.section_id}
                                            style={[
                                                styles.secChip,
                                                active && styles.secChipActive,
                                            ]}
                                            onPress={() =>
                                                handleSectionSelect(
                                                    s.section_id,
                                                )
                                            }
                                            activeOpacity={0.75}
                                        >
                                            <Text
                                                style={[
                                                    styles.secChipText,
                                                    active &&
                                                        styles.secChipTextActive,
                                                ]}
                                            >
                                                {s.section_name}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.dot,
                                                    {
                                                        backgroundColor: filled
                                                            ? Colors.green
                                                            : Colors.text3,
                                                    },
                                                ]}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </>
                    )}

                    {/* PREVIEW CARD */}
                    {selectedSectionId &&
                        selectedClass &&
                        (() => {
                            const sec = selectedClass.sections.find(
                                (s) => s.section_id === selectedSectionId,
                            );
                            if (!sec) return null;
                            const filled = sec.homework.filter(
                                (h) => h.description,
                            ).length;
                            const total = sec.homework.length;
                            return (
                                <View style={styles.previewCard}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.previewTitle}>
                                            Class {selectedClass.class_name} –{" "}
                                            {sec.section_name}
                                        </Text>
                                        <Text style={styles.previewSub}>
                                            {filled}/{total} subjects filled
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.previewBadge,
                                            {
                                                backgroundColor:
                                                    filled > 0
                                                        ? Colors.greenBg
                                                        : Colors.amberBg,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.previewBadgeText,
                                                {
                                                    color:
                                                        filled > 0
                                                            ? Colors.greenText
                                                            : Colors.amberText,
                                                },
                                            ]}
                                        >
                                            {filled > 0
                                                ? "✓ Has HW"
                                                : "○ Empty"}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}
                </ScrollView>
            )}

            {/* Bottom CTA */}
            {!loading && !error && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.proceedBtn,
                            (!selectedClassId || !selectedSectionId) &&
                                styles.proceedBtnDisabled,
                        ]}
                        onPress={handleProceed}
                        disabled={!selectedClassId || !selectedSectionId}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={[
                                Colors.purpleLight,
                                Colors.purple,
                                Colors.purpleDeeper,
                            ]}
                            style={styles.proceedGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.proceedText}>
                                View / Add Homework →
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // Header
    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        paddingTop: Spacing.md,
        overflow: "hidden",
        position: "relative",
    },
    decorCircle1: {
        position: "absolute",
        top: -50,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    decorCircle2: {
        position: "absolute",
        bottom: -60,
        left: -30,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.sm,
    },
    backArrow: { color: "#fff", fontSize: 18, fontWeight: "700" },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
        color: "#fff",
        marginBottom: 4,
    },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.65)" },

    // Steps
    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.md,
        paddingHorizontal: Spacing.lg,
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 6,
    },
    stepPill: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: Radius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    stepPillDone: {
        borderColor: Colors.purple,
        backgroundColor: Colors.purpleBg,
    },
    stepText: { fontSize: 12, fontWeight: "600", color: Colors.text3 },
    stepTextDone: { color: Colors.purple },
    stepArrow: { color: Colors.text3, fontSize: 14 },

    // Labels
    sectionLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.text2,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: Spacing.sm,
    },
    legendTxt: {
        fontSize: 10,
        fontWeight: "400",
        color: Colors.text3,
        textTransform: "none",
        letterSpacing: 0,
    },

    // Class chips
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    classChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: Radius.md,
        backgroundColor: Colors.card,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    classChipActive: {
        backgroundColor: Colors.purple,
        borderColor: Colors.purple,
    },
    classChipText: { fontSize: 15, fontWeight: "700", color: Colors.text1 },
    classChipTextActive: { color: "#fff" },

    // Section chips
    secChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: Radius.md,
        backgroundColor: Colors.card,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    secChipActive: { backgroundColor: Colors.blue, borderColor: Colors.blue },
    secChipText: { fontSize: 14, fontWeight: "600", color: Colors.text1 },
    secChipTextActive: { color: "#fff" },
    dot: { width: 7, height: 7, borderRadius: 4 },

    // Preview card
    previewCard: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: Spacing.xl,
        backgroundColor: Colors.card,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Shadow.sm,
    },
    previewTitle: { fontSize: 15, fontWeight: "700", color: Colors.text1 },
    previewSub: { fontSize: 12, color: Colors.text2, marginTop: 3 },
    previewBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.full,
    },
    previewBadgeText: { fontSize: 11, fontWeight: "700" },

    // States
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    loadTxt: { fontSize: 14, color: Colors.text3, marginTop: 8 },
    errorIcon: { fontSize: 40 },
    errorTxt: { fontSize: 14, color: Colors.text2, textAlign: "center" },
    retryBtn: {
        backgroundColor: Colors.amber,
        borderRadius: Radius.md,
        paddingHorizontal: 24,
        paddingVertical: 10,
        marginTop: 4,
    },
    retryTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },

    // Footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: Spacing.lg,
        backgroundColor: Colors.card,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    proceedBtn: { borderRadius: Radius.lg, overflow: "hidden", ...Shadow.sm },
    proceedBtnDisabled: { opacity: 0.4 },
    proceedGrad: { paddingVertical: 16, alignItems: "center" },
    proceedText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
