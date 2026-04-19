import React, { useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useAppContext } from "@/context/AppContext";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";
import { SectionLabel } from "@/components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const today = new Date(2026, 3, 2); // Apr 2, 2026

const FEATURE_CARDS = [
    {
        icon: "✅",
        title: "Attendance",
        sub: "Mark & track daily",
        badge: "2 pending",
        style: { bg: "#f0e8fd", color: Colors.purple, border: "#d8c5f7" },
        route: "/screens/attendance",
    },
    // {
    //     icon: "📚",
    //     title: "Homework",
    //     sub: "Assign & review",
    //     badge: "4 active",
    //     style: { bg: "#eff8ff", color: Colors.blue, border: "#c3e0fd" },
    //     // route: "/screens/homework",
    // },
    {
        icon: "📊",
        title: "Marks",
        sub: "Gradebook & exams",
        badge: "Enter grades",
        style: { bg: "#e7f9f0", color: Colors.green, border: "#a8e8cc" },
        route: "/screens/marks-entry",
    },
    // {
    //     icon: "🗓️",
    //     title: "Timetable",
    //     sub: "Your schedule",
    //     badge: "5 classes",
    //     style: { bg: "#fffaeb", color: Colors.amber, border: "#fcd96a" },
    //     // route: "/screens/timetable",
    // },
    // {
    //     icon: "📢",
    //     title: "Notices",
    //     sub: "School updates",
    //     badge: "3 new",
    //     style: { bg: "#fdf2fa", color: Colors.pink, border: "#f5b8e8" },
    //     // route: "/screens/notices",
    // },
    // {
    //     icon: "📋",
    //     title: "Reports",
    //     sub: "Student progress",
    //     badge: "View all",
    //     style: { bg: "#f0fdf9", color: Colors.teal, border: "#99e6da" },
    //     route: null,
    // },
    // {
    //     icon: "🏖️",
    //     title: "Leave",
    //     sub: "Apply & manage",
    //     badge: "1 pending",
    //     style: { bg: "#fef3f2", color: Colors.red, border: "#fcc" },
    //     route: null,
    // },
    // {
    //     icon: "💬",
    //     title: "Messages",
    //     sub: "Parent & staff chat",
    //     badge: "5 unread",
    //     style: { bg: "#f4f3ff", color: "#5925dc", border: "#d0ccf7" },
    //     route: null,
    // },
];

const TODAY_CLASSES = [
    {
        id: "5A",
        name: "Class 5-A",
        subject: "Mathematics · 32 students",
        time: "9:00 AM",
        icon: "📐",
        iconBg: "#f0e8fd",
        accent: Colors.purple,
        badgeLabel: "Pending",
        badgeVariant: "pending" as const,
    },
    {
        id: "6B",
        name: "Class 6-B",
        subject: "Science · 28 students",
        time: "11:00 AM",
        icon: "🔬",
        iconBg: Colors.greenBg,
        accent: Colors.green,
        badgeLabel: "Done",
        badgeVariant: "done" as const,
    },
    {
        id: "4C",
        name: "Class 4-C",
        subject: "English · 30 students",
        time: "1:00 PM",
        icon: "📖",
        iconBg: "#f5f5f5",
        accent: Colors.border,
        badgeLabel: "Upcoming",
        badgeVariant: "upcoming" as const,
    },
];
function todayISO(): string {
    const d = new Date();
    return d.toISOString().split("T")[0];
}
function addDays(iso: string, n: number): string {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
}

export default function HomeScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { attendance, homework } = useAppContext();

    const teacherName = user?.record?.name
        ? user.record.name.split(" ").slice(0, 2).join(" ")
        : "Teacher";

    const [selectedDate, setSelectedDate] = React.useState(todayISO());

    const totalPresent = React.useMemo(() => {
        let p = 0;
        Object.values(attendance).forEach((cls) =>
            Object.values(cls).forEach((v) => {
                if (v === "P") p++;
            }),
        );
        return p;
    }, [attendance]);

    const totalAbsent = React.useMemo(() => {
        let a = 0;
        Object.values(attendance).forEach((cls) =>
            Object.values(cls).forEach((v) => {
                if (v === "A") a++;
            }),
        );
        return a;
    }, [attendance]);
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
            >
                <View style={styles.headerDecor1} />
                <View style={styles.headerDecor2} />

                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.greetSmall}>Good morning,</Text>
                        <Text style={styles.greetBig}>{teacherName} 👋</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.notifBtn}
                        onPress={() => router.push("/screens/notices")}
                        activeOpacity={0.8}
                    >
                        <Text style={{ fontSize: 18 }}>🔔</Text>
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                </View>

                {/* Date Strip */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.dateStrip}
                    contentContainerStyle={{ paddingRight: 8 }}
                >
                    {/* {weekDates.map((d, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.dateChip,
                                d.offset === 0 && styles.dateToday,
                                selectedDate === i && styles.dateSel,
                            ]}
                            onPress={() => setSelectedDate(i)}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[
                                    styles.dcDay,
                                    (d.offset === 0 || selectedDate === i) &&
                                        styles.dcDayActive,
                                ]}
                            >
                                {d.day}
                            </Text>
                            <Text
                                style={[
                                    styles.dcNum,
                                    (d.offset === 0 || selectedDate === i) &&
                                        styles.dcNumActive,
                                ]}
                            >
                                {d.num}
                            </Text>
                        </TouchableOpacity>
                    ))} */}
                    {weekDates.map((d) => (
                        <TouchableOpacity
                            key={d.iso}
                            style={[
                                styles.dateChip,
                                d.isToday && styles.dateToday,
                                selectedDate === d.iso && styles.dateSel,
                            ]}
                            onPress={() => setSelectedDate(d.iso)}
                            activeOpacity={0.75}
                        >
                            <Text
                                style={[
                                    styles.dcDay,
                                    selectedDate === d.iso &&
                                        styles.dcDayActive,
                                ]}
                            >
                                {d.day}
                            </Text>
                            <Text
                                style={[
                                    styles.dcNum,
                                    selectedDate === d.iso &&
                                        styles.dcNumActive,
                                ]}
                            >
                                {d.num}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </LinearGradient>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {/* Quick Stats */}
                <SectionLabel label="Today's Overview" />
                <View style={styles.statsRow}>
                    {[
                        {
                            num: "3",
                            label: "Classes",
                            bg: "#f0e8fd",
                            border: "#d8c5f7",
                            color: Colors.purple,
                        },
                        {
                            num: totalPresent || "—",
                            label: "Present",
                            bg: Colors.greenBg,
                            border: "#a8e8cc",
                            color: Colors.green,
                        },
                        {
                            num: totalAbsent || "—",
                            label: "Absent",
                            bg: Colors.redBg,
                            border: "#fcc",
                            color: Colors.red,
                        },
                        {
                            num: String(homework.active.length),
                            label: "Tasks Due",
                            bg: Colors.amberBg,
                            border: "#fcd96a",
                            color: Colors.amber,
                        },
                    ].map((s, i) => (
                        <View
                            key={i}
                            style={[
                                styles.statPill,
                                {
                                    backgroundColor: s.bg,
                                    borderColor: s.border,
                                },
                            ]}
                        >
                            <Text style={[styles.statNum, { color: s.color }]}>
                                {s.num}
                            </Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Feature Grid */}
                <SectionLabel label="Features" />
                <View style={styles.featureGrid}>
                    {FEATURE_CARDS.map((fc, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[
                                styles.featCard,
                                {
                                    backgroundColor: fc.style.bg,
                                    borderColor: fc.style.border,
                                },
                            ]}
                            onPress={() =>
                                fc.route ? router.push(fc.route as any) : null
                            }
                            activeOpacity={0.8}
                        >
                            <Text style={styles.featIcon}>{fc.icon}</Text>
                            <Text
                                style={[
                                    styles.featTitle,
                                    { color: fc.style.color },
                                ]}
                            >
                                {fc.title}
                            </Text>
                            <Text
                                style={[
                                    styles.featSub,
                                    { color: fc.style.color },
                                ]}
                            >
                                {fc.sub}
                            </Text>
                            <View
                                style={[
                                    styles.featBadge,
                                    {
                                        backgroundColor:
                                            "rgba(255,255,255,0.5)",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.featBadgeText,
                                        { color: fc.style.color },
                                    ]}
                                >
                                    {fc.badge}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Today's Classes */}
                {/* <SectionLabel label="Today's Classes" />
                <View style={styles.classStrip}>
                    {TODAY_CLASSES.map((cls) => {
                        const badgeStyles = {
                            pending: {
                                bg: Colors.purpleBg,
                                color: Colors.purple,
                            },
                            done: {
                                bg: Colors.greenBg,
                                color: Colors.greenText,
                            },
                            upcoming: {
                                bg: Colors.surface,
                                color: Colors.text3,
                            },
                        }[cls.badgeVariant];
                        return (
                            <TouchableOpacity
                                key={cls.id}
                                style={[
                                    styles.classRow,
                                    { borderLeftColor: cls.accent },
                                ]}
                                onPress={() =>
                                    router.push("/screens/attendance")
                                }
                                activeOpacity={0.8}
                            >
                                <View
                                    style={[
                                        styles.classIcon,
                                        { backgroundColor: cls.iconBg },
                                    ]}
                                >
                                    <Text style={{ fontSize: 18 }}>
                                        {cls.icon}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.className}>
                                        {cls.name}
                                    </Text>
                                    <Text style={styles.classSub}>
                                        {cls.subject}
                                    </Text>
                                </View>
                                <View style={{ alignItems: "flex-end" }}>
                                    <Text style={styles.classTime}>
                                        {cls.time}
                                    </Text>
                                    <View
                                        style={[
                                            styles.classBadge,
                                            { backgroundColor: badgeStyles.bg },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.classBadgeText,
                                                { color: badgeStyles.color },
                                            ]}
                                        >
                                            {cls.badgeLabel}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View> */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: 16,
        paddingBottom: 0,
        position: "relative",
        overflow: "hidden",
    },
    headerDecor1: {
        position: "absolute",
        top: -60,
        right: -30,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: "rgba(255,255,255,0.07)",
    },
    headerDecor2: {
        position: "absolute",
        top: 10,
        right: 60,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    greetSmall: { fontSize: 13, color: "rgba(255,255,255,0.65)" },
    greetBig: {
        fontSize: 22,
        fontWeight: "800",
        color: Colors.white,
        marginTop: 2,
    },
    notifBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    notifDot: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.red,
        borderWidth: 2,
        borderColor: Colors.purple,
    },
    dateStrip: { marginTop: 14, marginBottom: 16 },
    dateChip: {
        width: 42,
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 12,
        marginRight: 6,
    },
    dateToday: { backgroundColor: "rgba(255,255,255,0.2)" },
    dateSel: { backgroundColor: Colors.white },
    dcDay: {
        fontSize: 10,
        fontWeight: "500",
        color: "rgba(255,255,255,0.65)",
        marginBottom: 4,
    },
    dcDayActive: { color: Colors.purple },
    dcNum: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.8)" },
    dcNumActive: { color: Colors.purple },
    statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: Spacing.lg },
    statPill: {
        flex: 1,
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
        borderWidth: 1,
    },
    statNum: { fontSize: 18, fontWeight: "800" },
    statLabel: {
        fontSize: 10,
        fontWeight: "500",
        marginTop: 2,
        color: Colors.text2,
    },
    featureGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        paddingHorizontal: Spacing.lg,
    },
    featCard: {
        width: "47.5%",
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        minHeight: 120,
        ...Shadow.sm,
    },
    featIcon: { fontSize: 26, marginBottom: 8 },
    featTitle: { fontSize: 13, fontWeight: "700" },
    featSub: { fontSize: 11, marginTop: 2, opacity: 0.7 },
    featBadge: {
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 3,
        marginTop: 8,
        alignSelf: "flex-start",
    },
    featBadgeText: { fontSize: 10, fontWeight: "700" },
    classStrip: {
        paddingHorizontal: Spacing.lg,
        gap: 8,
        flexDirection: "column",
    },
    classRow: {
        backgroundColor: Colors.card,
        borderRadius: 14,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        borderLeftWidth: 4,
        ...Shadow.sm,
    },
    classIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    className: { fontSize: 14, fontWeight: "700", color: Colors.text1 },
    classSub: { fontSize: 11, color: Colors.text2, marginTop: 2 },
    classTime: { fontSize: 11, color: Colors.text2, fontWeight: "500" },
    classBadge: {
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 3,
        marginTop: 4,
    },
    classBadgeText: { fontSize: 10, fontWeight: "600" },
});
