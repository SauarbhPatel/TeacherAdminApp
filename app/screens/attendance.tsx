/**
 * attendance.tsx
 *
 * Daily attendance overview screen.
 * - Purple gradient header with date strip (7 days centred on today)
 * - Summary pills: total students, present, absent, late
 * - Status bar: P / A / L / H counts + total classes
 * - Class cards — tap → attendance-mark screen
 * - filter=pending param from home dashboard → shows only unmarked classes
 *   with amber banner + "Clear" button
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
    Alert,
    BackHandler,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { getDailyAttendance } from "@/services/api";
import { DailyAttendanceClass, DailyAttendanceTotal } from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

// ─── Helpers ─────────────────────────────────────────────
function todayISO(): string {
    const d = new Date();
    return d.toISOString().split("T")[0];
}
function addDays(iso: string, n: number): string {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
}
function parseNum(v: string | number | null | undefined): number {
    if (v == null) return 0;
    return parseInt(String(v)) || 0;
}
function pct(part: number, total: number): number {
    if (!total) return 0;
    return Math.round((part / total) * 100);
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

// ─── Mini bar ─────────────────────────────────────────────
function MiniBar({
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
        <View style={bar.wrap}>
            {p > 0 && (
                <View
                    style={[
                        bar.seg,
                        { backgroundColor: Colors.green, width: `${p}%` },
                    ]}
                />
            )}
            {l > 0 && (
                <View
                    style={[
                        bar.seg,
                        { backgroundColor: Colors.amber, width: `${l}%` },
                    ]}
                />
            )}
            {a > 0 && (
                <View
                    style={[
                        bar.seg,
                        { backgroundColor: Colors.red, width: `${a}%` },
                    ]}
                />
            )}
        </View>
    );
}
const bar = StyleSheet.create({
    wrap: {
        height: 5,
        flexDirection: "row",
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: Colors.border,
        marginTop: 10,
    },
    seg: { height: 5 },
});

// ─── Status badge (Marked / Pending) ──────────────────────
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

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function AttendanceScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const params = useLocalSearchParams<{ filter?: string }>();

    // filter=pending → show only unmarked classes
    const filterPending = params.filter === "pending";

    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [allClasses, setAllClasses] = useState<DailyAttendanceClass[]>([]);
    const [total, setTotal] = useState<DailyAttendanceTotal | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    // ── Week date strip ──────────────────────────────────────
    const weekDates = useMemo(() => {
        const today = todayISO();
        const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return Array.from({ length: 7 }, (_, i) => {
            const iso = addDays(today, i - 3);
            const d = new Date(iso + "T00:00:00");
            return {
                iso,
                day: DAYS[d.getDay()],
                num: d.getDate(),
                isToday: iso === today,
            };
        });
    }, []);

    // ── Fetch ────────────────────────────────────────────────
    const fetchData = useCallback(
        async (date: string, silent = false) => {
            if (!user?.token) return;
            if (!silent) {
                setLoading(true);
                setError("");
            }
            try {
                const res = await getDailyAttendance(
                    date,
                    user.token,
                    user?.record?.school_id,
                );
                if (res.response_code === 200) {
                    setAllClasses(res.data || []);
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
        [user?.token, user?.record?.school_id],
    );

    useEffect(() => {
        fetchData(selectedDate);
    }, [selectedDate]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(selectedDate, true);
    };

    // ── Apply pending filter ─────────────────────────────────
    const classes = useMemo(() => {
        if (!filterPending) return allClasses;
        return allClasses.filter(
            (c) => !c.mark_by || c.mark_by.trim() === "" || c.mark_by === "-",
        );
    }, [allClasses, filterPending]);

    // ── Summary values ───────────────────────────────────────
    const totalStudents =
        total?.total_students ??
        allClasses.reduce((s, c) => s + parseNum(c.total_students), 0);
    const totalPresent =
        total?.total_present ??
        allClasses.reduce((s, c) => s + parseNum(c.total_present), 0);
    const totalAbsent =
        total?.total_absent ??
        allClasses.reduce((s, c) => s + parseNum(c.total_absent), 0);
    const totalLeave =
        total?.total_leave ??
        allClasses.reduce((s, c) => s + parseNum(c.total_late), 0);
    const markedCount = allClasses.filter(
        (c) => c.mark_by && c.mark_by.trim() !== "" && c.mark_by !== "-",
    ).length;
    const pendingCount = allClasses.length - markedCount;

    useEffect(() => {
        const backAction = () => {
            !router.canGoBack() ? router.replace("tabs") : router.back();
            return true;
        };
        const subscription = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction,
        );
        return () => subscription.remove();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
            {/* ── Header ── */}
            <LinearGradient
                colors={[Colors.purple, Colors.purpleDeeper]}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                <View style={styles.decor1} />
                <View style={styles.decor2} />

                {/* Top row */}
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
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
                        style={styles.backBtn}
                        onPress={() => fetchData(selectedDate, true)}
                        activeOpacity={0.75}
                    >
                        <Text style={{ fontSize: 16, color: "#fff" }}>↻</Text>
                    </TouchableOpacity>
                </View>

                {/* Date strip */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, paddingBottom: 14 }}
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
                {!loading && (
                    <View style={styles.summaryRow}>
                        {[
                            {
                                num: totalStudents,
                                label: "Students",
                                color: "#c4b5fd",
                            },
                            {
                                num: totalPresent,
                                label: "Present",
                                color: "#4ade80",
                            },
                            {
                                num: totalAbsent,
                                label: "Absent",
                                color: "#f87171",
                            },
                            {
                                num: totalLeave,
                                label: "Leave",
                                color: "#fbbf24",
                            },
                        ].map((s, i) => (
                            <View key={i} style={styles.summaryPill}>
                                <Text
                                    style={[
                                        styles.summaryNum,
                                        { color: s.color },
                                    ]}
                                >
                                    {s.num}
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
            <View style={styles.statusBar}>
                <View style={styles.statusItem}>
                    <View
                        style={[
                            styles.statusDot,
                            { backgroundColor: Colors.green },
                        ]}
                    />
                    <Text style={styles.statusText}>{markedCount} marked</Text>
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
                    {allClasses.length} classes total
                </Text>
            </View>

            {/* ── Filter banner (when filter=pending active) ── */}
            {filterPending && !loading && (
                <View style={styles.filterBanner}>
                    <Text style={styles.filterBannerTxt}>
                        ⏳ Showing {classes.length} pending class
                        {classes.length !== 1 ? "es" : ""} only
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.setParams({ filter: "" })}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={styles.filterClear}>Show all ✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Body ── */}
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
                            <Text style={styles.emptyEmoji}>
                                {filterPending ? "🎉" : "📋"}
                            </Text>
                            <Text style={styles.emptyTitle}>
                                {filterPending
                                    ? "All classes marked!"
                                    : "No classes found"}
                            </Text>
                            <Text style={styles.emptyMsg}>
                                {filterPending
                                    ? "Great job — attendance is complete for today."
                                    : "No class data available for this date."}
                            </Text>
                        </View>
                    ) : (
                        classes.map((cls, i) => {
                            const isMarked = !!(
                                cls.mark_by &&
                                cls.mark_by.trim() !== "" &&
                                cls.mark_by !== "-"
                            );
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
                                    {/* Card top row */}
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
                                                {total_s} students
                                                {cls.mark_by &&
                                                cls.mark_by.trim() &&
                                                cls.mark_by !== "-"
                                                    ? ` · Marked by ${cls.mark_by}`
                                                    : ""}
                                            </Text>
                                        </View>
                                        <StatusBadge marked={isMarked} />
                                    </View>

                                    {/* Mini bar */}
                                    <MiniBar
                                        present={p}
                                        absent={a}
                                        leave={l}
                                        total={total_s}
                                    />

                                    {/* Stat boxes */}
                                    <View style={styles.statsRow}>
                                        {[
                                            {
                                                val: p,
                                                pct: pct(p, total_s),
                                                label: "Present",
                                                bg: Colors.greenBg,
                                                color: Colors.greenText,
                                            },
                                            {
                                                val: a,
                                                pct: pct(a, total_s),
                                                label: "Absent",
                                                bg: Colors.redBg,
                                                color: Colors.redText,
                                            },
                                            {
                                                val: l,
                                                pct: pct(l, total_s),
                                                label: "Leave",
                                                bg: Colors.amberBg,
                                                color: Colors.amberText,
                                            },
                                            {
                                                val: h,
                                                pct: pct(h, total_s),
                                                label: "Half",
                                                bg: Colors.blueBg,
                                                color: Colors.blueText,
                                            },
                                        ].map((s, j) => (
                                            <View
                                                key={j}
                                                style={[
                                                    styles.statBox,
                                                    { backgroundColor: s.bg },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.statVal,
                                                        { color: s.color },
                                                    ]}
                                                >
                                                    {s.val}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.statPct,
                                                        { color: s.color },
                                                    ]}
                                                >
                                                    {s.pct}%
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.statLbl,
                                                        { color: s.color },
                                                    ]}
                                                >
                                                    {s.label}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Pending hint */}
                                    {!isMarked && (
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
        paddingBottom: 0,
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
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },

    // Date strip
    dateChip: {
        alignItems: "center",
        paddingHorizontal: 10,
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
    summaryRow: { flexDirection: "row", gap: 8, zIndex: 1, paddingBottom: 14 },
    summaryPill: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.14)",
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

    // Filter banner
    filterBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.amberBg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.amber + "40",
    },
    filterBannerTxt: {
        fontSize: 13,
        fontWeight: "700",
        color: Colors.amberText,
    },
    filterClear: { fontSize: 12, fontWeight: "700", color: Colors.amber },

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
    emptyMsg: {
        fontSize: 13,
        color: Colors.text3,
        marginTop: 4,
        textAlign: "center",
    },
});
