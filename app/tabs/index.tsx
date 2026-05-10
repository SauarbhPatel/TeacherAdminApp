
/**
 * app/tabs/index.tsx — Home Dashboard
 *
 * "Today's Overview" 4 cards are now dynamic via getDailyAttendance:
 *   1. Total Classes / Total Students
 *   2. Total Present
 *   3. Total Absent
 *   4. Pending (not marked) — clickable → /screens/attendance?filter=pending
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getDailyAttendance } from "@/services/api";
import {
    DailyAttendanceClass,
    DailyAttendanceTotal,
} from "@/types";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";
import { SectionLabel } from "@/components/ui";

// ─── Helpers ─────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayISO(): string {
    return new Date().toISOString().split("T")[0];
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

// ─── Feature cards ────────────────────────────────────────
const FEATURE_CARDS = [
    {
        icon: "✅",
        title: "Attendance",
        sub: "Mark & track daily",
        badge: "Daily",
        style: { bg: "#f0e8fd", color: Colors.purple, border: "#d8c5f7" },
        route: "/screens/attendance",
    },
    {
        icon: "📚",
        title: "Homework",
        sub: "Assign & review",
        badge: "Manage",
        style: { bg: "#eff8ff", color: Colors.blue, border: "#c3e0fd" },
        route: "/screens/homework-dashboard",
    },
    {
        icon: "📊",
        title: "Exam",
        sub: "Marks, grades & more",
        badge: "Entry",
        style: { bg: "#e7f9f0", color: Colors.green, border: "#a8e8cc" },
        route: "/screens/exam",
    },
    {
        icon: "📝",
        title: "Test Marks",
        sub: "Class & unit tests",
        badge: "Entry",
        style: { bg: Colors.tealBg, color: Colors.teal, border: "#99e6da" },
        route: "/screens/test-marks-entry",
    },
];

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();

    // ── Date strip state ─────────────────────────────────────
    const weekDates = useMemo(() => {
        const t = todayISO();
        return Array.from({ length: 7 }, (_, i) => {
            const iso = addDays(t, i - 3);
            const d = new Date(iso + "T00:00:00");
            return { iso, day: DAYS[d.getDay()], num: d.getDate(), isToday: iso === t };
        });
    }, []);
    const [selectedDate, setSelectedDate] = useState(todayISO());

    // ── Attendance overview state ─────────────────────────────
    const [attData, setAttData] = useState<DailyAttendanceClass[]>([]);
    const [attTotal, setAttTotal] = useState<DailyAttendanceTotal | null>(null);
    const [attLoading, setAttLoading] = useState(true);

    const fetchAtt = useCallback(async (date: string) => {
        if (!user?.token || !user.record) return;
        setAttLoading(true);
        try {
            const res = await getDailyAttendance(date, user.token, user.record.school_id);
            if (res.response_code === 200) {
                setAttData(res.data ?? []);
                setAttTotal(res.total ?? null);
            }
        } catch {}
        finally { setAttLoading(false); }
    }, [user?.token, user?.record?.school_id]);

    useEffect(() => { fetchAtt(selectedDate); }, [selectedDate]);

    // ── Derived stats ─────────────────────────────────────────
    const stats = useMemo(() => {
        const totalClasses = attData.length;
        const totalStudents = attData.reduce((s, c) => s + parseNum(c.total_students), 0);
        const totalPresent = attTotal?.total_present ?? attData.reduce((s, c) => s + parseNum(c.total_present), 0);
        const totalAbsent = attTotal?.total_absent ?? attData.reduce((s, c) => s + parseNum(c.total_absent), 0);
        // pending = classes where mark_by is empty/null

        console.log(JSON.stringify(attData));
        const pendingClasses = attData.filter(c => !c.mark_by || c.mark_by.trim() == '-').length;
        return { totalClasses, totalStudents, totalPresent, totalAbsent, pendingClasses };
    }, [attData, attTotal]);

    const firstName = user?.record?.name?.split(" ")[0] ?? "Teacher";

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
            {/* ── Header ── */}
            <LinearGradient
                colors={[Colors.purple, Colors.purpleDeeper]}
                style={[styles.header, { paddingTop: insets.top + 16 }]}
            >
                <View style={styles.decor1} />
                <View style={styles.decor2} />

                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.greeting}>Good morning 👋</Text>
                        <Text style={styles.name}>{firstName}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.avatarBtn}
                        onPress={() => router.push("/tabs/profile" as any)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.avatarTxt}>
                            {firstName[0]?.toUpperCase()}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Date strip */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, paddingBottom: 16 }}
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
                            <Text style={[styles.dcDay, selectedDate === d.iso && styles.dcDayActive]}>
                                {d.day}
                            </Text>
                            <Text style={[styles.dcNum, selectedDate === d.iso && styles.dcNumActive]}>
                                {d.num}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

                {/* ── Today's Overview ── */}
                <SectionLabel label="Today's Attendance Overview" />

                {attLoading ? (
                    <View style={styles.statsRow}>
                        {[0, 1, 2, 3].map(i => (
                            <View key={i} style={[styles.statCard, { backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center' }]}>
                                <ActivityIndicator size="small" color={Colors.purple} />
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.statsRow}>
                        {/* Card 1: Classes / Students */}
                        <View style={[styles.statCard, { backgroundColor: '#f0e8fd', borderColor: '#d8c5f7' }]}>
                            <Text style={[styles.statNum, { color: Colors.purple }]}>{stats.totalClasses}</Text>
                            <Text style={[styles.statLabel, { color: Colors.purple }]}>Classes</Text>
                            <Text style={[styles.statSub, { color: Colors.purple + 'aa' }]}>{stats.totalStudents} students</Text>
                        </View>

                          {/* Card 4: Pending — CLICKABLE */}
                        <TouchableOpacity
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor: stats.pendingClasses > 0 ? Colors.amberBg : Colors.greenBg,
                                    borderColor: stats.pendingClasses > 0 ? '#fcd96a' : '#a8e8cc',
                                },
                            ]}
                            onPress={() =>
                                router.push({
                                    pathname: '/screens/attendance' as any,
                                    params: { filter: 'pending' },
                                })
                            }
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.statNum, { color: stats.pendingClasses > 0 ? Colors.amber : Colors.green }]}>
                                {stats.pendingClasses}
                            </Text>
                            <Text style={[styles.statLabel, { color: stats.pendingClasses > 0 ? Colors.amberText : Colors.greenText }]}>
                                Pending
                            </Text>
                            <Text style={[styles.statSub, { color: (stats.pendingClasses > 0 ? Colors.amber : Colors.green) + 'aa' }]}>
                                {stats.pendingClasses > 0 ? 'Tap to mark →' : 'All done!'}
                            </Text>
                        </TouchableOpacity>

                        {/* Card 2: Present */}
                        <View style={[styles.statCard, { backgroundColor: Colors.greenBg, borderColor: '#a8e8cc' }]}>
                            <Text style={[styles.statNum, { color: Colors.green }]}>{stats.totalPresent}</Text>
                            <Text style={[styles.statLabel, { color: Colors.greenText }]}>Present</Text>
                            <Text style={[styles.statSub, { color: Colors.green + 'aa' }]}>
                                {stats.totalStudents > 0
                                    ? `${Math.round((stats.totalPresent / stats.totalStudents) * 100)}%`
                                    : '—'}
                            </Text>
                        </View>

                        {/* Card 3: Absent */}
                        <View style={[styles.statCard, { backgroundColor: Colors.redBg, borderColor: '#fca5a5' }]}>
                            <Text style={[styles.statNum, { color: Colors.red }]}>{stats.totalAbsent}</Text>
                            <Text style={[styles.statLabel, { color: Colors.redText }]}>Absent</Text>
                            <Text style={[styles.statSub, { color: Colors.red + 'aa' }]}>
                                {stats.totalStudents > 0
                                    ? `${Math.round((stats.totalAbsent / stats.totalStudents) * 100)}%`
                                    : '—'}
                            </Text>
                        </View>

                      
                    </View>
                )}

                {/* ── Quick Actions ── */}
                <SectionLabel label="Features" />
                <View style={styles.featGrid}>
                    {FEATURE_CARDS.map((fc, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.featCard, { backgroundColor: fc.style.bg, borderColor: fc.style.border }]}
                            onPress={() => router.push(fc.route as any)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.featIcon}>{fc.icon}</Text>
                            <Text style={[styles.featTitle, { color: fc.style.color }]}>{fc.title}</Text>
                            <Text style={[styles.featSub, { color: fc.style.color + 'bb' }]}>{fc.sub}</Text>
                            <View style={[styles.featBadge, { backgroundColor: "rgba(255,255,255,0.5)" }]}>
                                <Text style={[styles.featBadgeText, { color: fc.style.color }]}>{fc.badge}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: Spacing.xl, paddingBottom: 0, overflow: 'hidden', position: 'relative' },
    decor1: { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)' },
    decor2: { position: 'absolute', bottom: -40, left: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.04)' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    greeting: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
    name: { fontSize: 22, fontWeight: '900', color: '#fff' },
    avatarBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { fontSize: 18, fontWeight: '800', color: '#fff' },
    // Date strip
    dateChip: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
    dateChipToday: { backgroundColor: 'rgba(255,255,255,0.18)' },
    dateChipSel: { backgroundColor: '#fff' },
    dcDay: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.65)', marginBottom: 3 },
    dcNum: { fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.85)' },
    dcDayActive: { color: Colors.purple },
    dcNumActive: { color: Colors.purple },
    // Stats
    statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.lg, marginBottom: 8 },
    statCard: {
        flex: 1, borderRadius: Radius.lg, borderWidth: 1.5,
        paddingVertical: 12, paddingHorizontal: 6,
        alignItems: 'center', gap: 2, ...Shadow.sm,
    },
    statIcon: { fontSize: 16, marginBottom: 2 },
    statNum: { fontSize: 20, fontWeight: '900' },
    statLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
    statSub: { fontSize: 8, fontWeight: '600', textAlign: 'center' },
    // Feature grid
    featGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: Spacing.lg },
    featCard: {
        width: '47%', borderRadius: Radius.xl, borderWidth: 1.5,
        padding: 14, gap: 4, ...Shadow.sm,
    },
    featIcon: { fontSize: 24 },
    featTitle: { fontSize: 15, fontWeight: '800' },
    featSub: { fontSize: 11, fontWeight: '500', lineHeight: 15 },
    featBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
    featBadgeText: { fontSize: 10, fontWeight: '700' },
});