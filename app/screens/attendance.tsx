import React, { useState, useEffect, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getDailyAttendance } from "@/services/api";
import { DailyAttendanceClass, DailyAttendanceTotal } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

// ─── Helpers ─────────────────────────────────────────────
function todayISO(): string {
    const d = new Date();
    return d.toISOString().split("T")[0];
}

function formatDisplayDate(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function addDays(iso: string, n: number): string {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
}

function parseNum(v: string | number | null): number {
    if (v === null || v === undefined) return 0;
    return parseInt(String(v)) || 0;
}

function pct(part: number, total: number): number {
    if (!total) return 0;
    return Math.round((part / total) * 100);
}

// ─── Donut mini-chart ────────────────────────────────────
function MiniDonut({
    present,
    absent,
    leave,
    total,
}: {
    present: number;
    absent: number;
    leave: number;
    total: number;
}) {
    const p = pct(present, total);
    const a = pct(absent, total);
    const l = pct(leave, total);
    return (
        <View style={donut.wrap}>
            <View
                style={[
                    donut.slice,
                    { backgroundColor: Colors.green, width: `${p}%` },
                ]}
            />
            <View
                style={[
                    donut.slice,
                    { backgroundColor: Colors.amber, width: `${l}%` },
                ]}
            />
            <View
                style={[
                    donut.slice,
                    { backgroundColor: Colors.red, width: `${a}%` },
                ]}
            />
        </View>
    );
}
const donut = StyleSheet.create({
    wrap: {
        height: 5,
        flexDirection: "row",
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: Colors.border,
        marginTop: 10,
    },
    slice: { height: 5 },
});

// ─── Status badge ─────────────────────────────────────────
function StatusBadge({ marked }: { marked: boolean }) {
    return (
        <View
            style={[
                badge.wrap,
                { backgroundColor: marked ? Colors.greenBg : Colors.amberBg },
            ]}
        >
            <View
                style={[
                    badge.dot,
                    { backgroundColor: marked ? Colors.green : Colors.amber },
                ]}
            />
            <Text
                style={[
                    badge.text,
                    { color: marked ? Colors.greenText : Colors.amberText },
                ]}
            >
                {marked ? "Marked" : "Pending"}
            </Text>
        </View>
    );
}
const badge = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    text: { fontSize: 10, fontWeight: "700" },
});

// ─── Screen ───────────────────────────────────────────────
export default function AttendanceScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [classes, setClasses] = useState<DailyAttendanceClass[]>([]);
    const [total, setTotal] = useState<DailyAttendanceTotal | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // Build week strip centred on today
    const weekDates = React.useMemo(() => {
        const today = todayISO();
        return Array.from({ length: 7 }, (_, i) => {
            const iso = addDays(today, i - 3);
            const d = new Date(iso + "T00:00:00");
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return {
                iso,
                day: days[d.getDay()],
                num: d.getDate(),
                isToday: iso === today,
            };
        });
    }, []);

    const fetchData = useCallback(
        async (date: string, silent = false) => {
            if (!user?.token) return;
            if (!silent) setLoading(true);
            setError("");
            try {
                const res = await getDailyAttendance(date, user.token);
                if (res.response_code === 200) {
                    setClasses(res.data || []);
                    setTotal(res.total || null);
                } else {
                    setError(
                        res.response_message || "Failed to load attendance.",
                    );
                }
            } catch (e: any) {
                setError(e?.message || "Network error. Please try again.");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [user?.token],
    );

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(selectedDate, true);
    };

    const markedCount = classes.filter(
        (c) => c.mark_by && c.mark_by !== "-",
    ).length;
    const pendingCount = classes.length - markedCount;

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
            {/* ── Header ── */}
            <LinearGradient
                colors={[Colors.purple, Colors.purpleDeeper]}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />

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
                        <Text style={styles.headerTitle}>Attendance</Text>
                        <Text style={styles.headerSub}>
                            {formatDisplayDate(selectedDate)}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.refreshBtn}
                        onPress={() => fetchData(selectedDate, true)}
                        activeOpacity={0.75}
                    >
                        <Text style={{ fontSize: 16 }}>↻</Text>
                    </TouchableOpacity>
                </View>

                {/* Date strip */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateStrip}
                >
                    {weekDates.map((d) => (
                        <TouchableOpacity
                            key={d.iso}
                            style={[
                                styles.dateChip,
                                d.isToday && styles.dateChipToday,
                                selectedDate === d.iso && styles.dateChipSel,
                            ]}
                            onPress={() => setSelectedDate(d.iso)}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[
                                    styles.dcDay,
                                    selectedDate === d.iso && styles.dcActive,
                                ]}
                            >
                                {d.day}
                            </Text>
                            <Text
                                style={[
                                    styles.dcNum,
                                    selectedDate === d.iso && styles.dcActive,
                                ]}
                            >
                                {d.num}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Summary pills */}
                {total && (
                    <View style={styles.summaryRow}>
                        {[
                            {
                                label: "Total",
                                val: total.total_students,
                                color: Colors.white,
                                bg: "rgba(255,255,255,0.18)",
                            },
                            {
                                label: "Present",
                                val: total.total_present,
                                color: "#4ade80",
                                bg: "rgba(74,222,128,0.18)",
                            },
                            {
                                label: "Absent",
                                val: total.total_absent,
                                color: "#f87171",
                                bg: "rgba(248,113,113,0.18)",
                            },
                            {
                                label: "Leave",
                                val: total.total_leave,
                                color: "#fbbf24",
                                bg: "rgba(251,191,36,0.18)",
                            },
                        ].map((s, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.summaryPill,
                                    { backgroundColor: s.bg },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.summaryNum,
                                        { color: s.color },
                                    ]}
                                >
                                    {s.val}
                                </Text>
                                <Text style={styles.summaryLabel}>
                                    {s.label}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </LinearGradient>

            {/* ── Status bar ── */}
            {!loading && classes.length > 0 && (
                <View style={styles.statusBar}>
                    <View style={styles.statusItem}>
                        <View
                            style={[
                                styles.statusDot,
                                { backgroundColor: Colors.green },
                            ]}
                        />
                        <Text style={styles.statusText}>
                            {markedCount} marked
                        </Text>
                    </View>
                    <View style={styles.statusItem}>
                        <View
                            style={[
                                styles.statusDot,
                                { backgroundColor: Colors.amber },
                            ]}
                        />
                        <Text style={styles.statusText}>
                            {pendingCount} pending
                        </Text>
                    </View>
                    <Text style={styles.statusTotal}>
                        {classes.length} total classes
                    </Text>
                </View>
            )}

            {/* ── Content ── */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.purple} />
                    <Text style={styles.loadingText}>Loading attendance…</Text>
                </View>
            ) : error ? (
                <View style={styles.centered}>
                    <Text style={styles.errorEmoji}>⚠️</Text>
                    <Text style={styles.errorTitle}>Could not load data</Text>
                    <Text style={styles.errorMsg}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryBtn}
                        onPress={() => fetchData(selectedDate)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.retryText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        padding: Spacing.lg,
                        paddingTop: 12,
                        paddingBottom: 32,
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.purple}
                        />
                    }
                >
                    {classes.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Text style={styles.emptyEmoji}>📋</Text>
                            <Text style={styles.emptyTitle}>
                                No classes found
                            </Text>
                            <Text style={styles.emptyMsg}>
                                No class data available for this date.
                            </Text>
                        </View>
                    ) : (
                        classes.map((cls, i) => {
                            const isMarked = cls.mark_by && cls.mark_by !== "-";
                            const total_s = parseNum(cls.total_students);
                            const p = parseNum(cls.total_present);
                            const a = parseNum(cls.total_absent);
                            const l = parseNum(cls.total_late);
                            const h = parseNum(cls.total_half_day);

                            return (
                                <TouchableOpacity
                                    key={`${cls.class_id}-${cls.section_id}-${i}`}
                                    style={[
                                        styles.classCard,
                                        isMarked && styles.classCardMarked,
                                    ]}
                                    onPress={() =>
                                        router.push({
                                            pathname:
                                                "/screens/attendance-mark",
                                            params: {
                                                class_id: cls.class_id,
                                                section_id: cls.section_id,
                                                class_name: cls.class_name,
                                                section_name: cls.section_name,
                                                date: selectedDate,
                                            },
                                        })
                                    }
                                    activeOpacity={0.82}
                                >
                                    {/* Card top */}
                                    <View style={styles.cardTop}>
                                        <View
                                            style={[
                                                styles.classIconWrap,
                                                {
                                                    backgroundColor: isMarked
                                                        ? Colors.greenBg
                                                        : Colors.purpleBg,
                                                },
                                            ]}
                                        >
                                            <Text style={styles.classIconText}>
                                                {isMarked ? "✅" : "📋"}
                                            </Text>
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.className}>
                                                Class {cls.class_name} –{" "}
                                                {cls.section_name}
                                            </Text>
                                            <Text style={styles.classStudents}>
                                                {total_s} student
                                                {total_s !== 1 ? "s" : ""}
                                            </Text>
                                        </View>

                                        <StatusBadge marked={!!isMarked} />
                                    </View>

                                    {/* Stats row — only show if marked */}
                                    {isMarked ? (
                                        <>
                                            <View style={styles.statsRow}>
                                                {[
                                                    {
                                                        label: "Present",
                                                        val: p,
                                                        pct: pct(p, total_s),
                                                        color: Colors.greenText,
                                                        bg: Colors.greenBg,
                                                    },
                                                    {
                                                        label: "Absent",
                                                        val: a,
                                                        pct: pct(a, total_s),
                                                        color: Colors.redText,
                                                        bg: Colors.redBg,
                                                    },
                                                    {
                                                        label: "Leave",
                                                        val: l,
                                                        pct: pct(l, total_s),
                                                        color: Colors.amberText,
                                                        bg: Colors.amberBg,
                                                    },
                                                    {
                                                        label: "Half Day",
                                                        val: h,
                                                        pct: pct(h, total_s),
                                                        color: Colors.blueText,
                                                        bg: Colors.blueBg,
                                                    },
                                                ].map((s, si) => (
                                                    <View
                                                        key={si}
                                                        style={[
                                                            styles.statBox,
                                                            {
                                                                backgroundColor:
                                                                    s.bg,
                                                            },
                                                        ]}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.statVal,
                                                                {
                                                                    color: s.color,
                                                                },
                                                            ]}
                                                        >
                                                            {s.val}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.statPct,
                                                                {
                                                                    color: s.color,
                                                                },
                                                            ]}
                                                        >
                                                            {s.pct}%
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.statLbl,
                                                                {
                                                                    color: s.color,
                                                                },
                                                            ]}
                                                        >
                                                            {s.label}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <MiniDonut
                                                present={p}
                                                absent={a}
                                                leave={l}
                                                total={total_s}
                                            />
                                            <Text
                                                style={styles.markedBy}
                                                numberOfLines={2}
                                            >
                                                Marked by: {cls.mark_by}
                                            </Text>
                                        </>
                                    ) : (
                                        <View style={styles.pendingHint}>
                                            <Text
                                                style={styles.pendingHintText}
                                            >
                                                Tap to mark attendance →
                                            </Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // Header
    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        position: "relative",
        overflow: "hidden",
    },
    headerDecor1: {
        position: "absolute",
        top: -50,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    headerDecor2: {
        position: "absolute",
        bottom: -40,
        left: -20,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
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
    headerTitle: { fontSize: 19, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },

    // Date strip
    dateStrip: { gap: 6, paddingBottom: 14, paddingRight: 4 },
    dateChip: {
        width: 44,
        alignItems: "center",
        paddingVertical: 8,
        borderRadius: 12,
    },
    dateChipToday: { backgroundColor: "rgba(255,255,255,0.18)" },
    dateChipSel: { backgroundColor: "#fff" },
    dcDay: {
        fontSize: 10,
        fontWeight: "600",
        color: "rgba(255,255,255,0.65)",
        marginBottom: 3,
    },
    dcNum: { fontSize: 16, fontWeight: "800", color: "rgba(255,255,255,0.85)" },
    dcActive: { color: Colors.purple },

    // Summary pills
    summaryRow: { flexDirection: "row", gap: 8, zIndex: 1 },
    summaryPill: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
    },
    summaryNum: { fontSize: 18, fontWeight: "900" },
    summaryLabel: {
        fontSize: 9,
        fontWeight: "600",
        color: "rgba(255,255,255,0.7)",
        marginTop: 2,
    },

    // Status bar
    statusBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: Spacing.lg,
        paddingVertical: 10,
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 12,
    },
    statusItem: { flexDirection: "row", alignItems: "center", gap: 5 },
    statusDot: { width: 7, height: 7, borderRadius: 4 },
    statusText: { fontSize: 12, fontWeight: "600", color: Colors.text2 },
    statusTotal: {
        marginLeft: "auto",
        fontSize: 11,
        color: Colors.text3,
        fontWeight: "600",
    },

    // Class cards
    classCard: {
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        marginBottom: 10,
        ...Shadow.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    classCardMarked: { borderColor: Colors.greenBg },
    cardTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 4,
    },
    classIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    classIconText: { fontSize: 20 },
    className: { fontSize: 15, fontWeight: "800", color: Colors.text1 },
    classStudents: { fontSize: 12, color: Colors.text3, marginTop: 2 },

    // Stats inside card
    statsRow: { flexDirection: "row", gap: 6, marginTop: 12 },
    statBox: {
        flex: 1,
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: "center",
    },
    statVal: { fontSize: 16, fontWeight: "900" },
    statPct: { fontSize: 9, fontWeight: "700", opacity: 0.75 },
    statLbl: { fontSize: 9, fontWeight: "600", marginTop: 1 },

    markedBy: {
        fontSize: 10,
        color: Colors.text3,
        marginTop: 8,
        fontStyle: "italic",
    },

    pendingHint: {
        backgroundColor: Colors.purplePale,
        borderRadius: 10,
        padding: 10,
        marginTop: 8,
        alignItems: "center",
    },
    pendingHintText: { fontSize: 12, fontWeight: "600", color: Colors.purple },

    // States
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    loadingText: { marginTop: 12, fontSize: 14, color: Colors.text3 },
    errorEmoji: { fontSize: 40, marginBottom: 12 },
    errorTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: Colors.text1,
        marginBottom: 6,
    },
    errorMsg: {
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
    retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    emptyWrap: { alignItems: "center", paddingTop: 60 },
    emptyEmoji: { fontSize: 44, marginBottom: 12 },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.text1 },
    emptyMsg: { fontSize: 13, color: Colors.text3, marginTop: 4 },
});
