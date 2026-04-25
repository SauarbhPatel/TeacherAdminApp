/**
 * exam.tsx  — Exam Hub
 *
 * Landing screen for all exam-related features.
 * Shows 4 cards: Marks Entry, Grade Report, Exam Attendance, Remarks.
 */

import React from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";

// ─── Card definitions ─────────────────────────────────────
const EXAM_FEATURES = [
    {
        icon: "📊",
        title: "Marks Entry",
        sub: "Enter & update student exam scores subject-wise",
        badge: "Enter Now",
        bg: "#e7f9f0",
        border: "#a8e8cc",
        iconBg: Colors.greenBg,
        color: Colors.green,
        accentColor: Colors.green,
        route: "/screens/marks-entry",
    },
    {
        icon: "🏆",
        title: "Grade Report",
        sub: "Enter co-scholastic grades for activities & skills",
        badge: "Enter Now",
        bg: "#f0e8fd",
        border: "#d8c5f7",
        iconBg: Colors.purpleBg,
        color: Colors.purple,
        accentColor: Colors.purple,
        route: "/screens/coscholastic-entry",
    },
    {
        icon: "✅",
        title: "Exam Attendance",
        sub: "Track student presence during examination days",
        badge: "Enter Now",
        bg: "#eff8ff",
        border: "#c3e0fd",
        iconBg: Colors.blueBg,
        color: Colors.blue,
        accentColor: Colors.blue,
        route: "/screens/exam-attendance-entry",
    },
    {
        icon: "💬",
        title: "Remarks",
        sub: "Add teacher remarks and feedback for students",
        badge: "Enter Now",
        bg: "#fffaeb",
        border: "#fcd96a",
        iconBg: Colors.amberBg,
        color: Colors.amber,
        accentColor: Colors.amber,
        route: "/screens/exam-remarks-entry",
    },
];

export default function ExamScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
            {/* ── Header ── */}
            <LinearGradient
                colors={[Colors.purple, Colors.purpleDeeper]}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                <View style={styles.decor1} />
                <View style={styles.decor2} />
                <View style={styles.decor3} />

                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => router.back()}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.heroIcon}>🎓</Text>
                <Text style={styles.heroTitle}>Exam Management</Text>
                <Text style={styles.heroSub}>
                    Marks, grades, attendance & feedback
                </Text>
            </LinearGradient>

            {/* ── Feature Cards ── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    padding: Spacing.lg,
                    gap: 12,
                    paddingBottom: 40,
                }}
            >
                <Text style={styles.sectionTitle}>Features</Text>

                {EXAM_FEATURES.map((feat, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[
                            styles.featCard,
                            {
                                backgroundColor: feat.bg,
                                borderColor: feat.border,
                            },
                            !feat.route && styles.featCardDisabled,
                        ]}
                        onPress={() =>
                            feat.route ? router.push(feat.route as any) : null
                        }
                        activeOpacity={feat.route ? 0.8 : 1}
                    >
                        {/* Left accent bar */}
                        <View
                            style={[
                                styles.accentBar,
                                { backgroundColor: feat.accentColor },
                            ]}
                        />

                        {/* Icon */}
                        <View
                            style={[
                                styles.featIconWrap,
                                { backgroundColor: feat.iconBg },
                            ]}
                        >
                            <Text style={styles.featIconEmoji}>
                                {feat.icon}
                            </Text>
                        </View>

                        {/* Text */}
                        <View style={{ flex: 1 }}>
                            <View style={styles.featTitleRow}>
                                <Text
                                    style={[
                                        styles.featTitle,
                                        { color: feat.color },
                                    ]}
                                >
                                    {feat.title}
                                </Text>
                                {!feat.route && (
                                    <View style={styles.soonBadge}>
                                        <Text style={styles.soonTxt}>Soon</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.featSub}>{feat.sub}</Text>
                        </View>

                        {/* Arrow */}
                        {feat.route ? (
                            <View
                                style={[
                                    styles.arrowCircle,
                                    {
                                        backgroundColor:
                                            feat.accentColor + "22",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.arrow,
                                        { color: feat.color },
                                    ]}
                                >
                                    ›
                                </Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // Header
    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxl,
        position: "relative",
        overflow: "hidden",
    },
    decor1: {
        position: "absolute",
        top: -60,
        right: -40,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    decor2: {
        position: "absolute",
        bottom: -50,
        left: -20,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    decor3: {
        position: "absolute",
        top: 40,
        left: 60,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    headerTop: { zIndex: 1, marginBottom: 16 },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    backArrow: { color: "#fff", fontSize: 18, fontWeight: "700" },

    heroIcon: { fontSize: 30, zIndex: 1 },
    heroTitle: {
        fontSize: 26,
        fontWeight: "900",
        color: "#fff",
        letterSpacing: -0.5,
        zIndex: 1,
    },
    heroSub: {
        fontSize: 13,
        color: "rgba(255,255,255,0.65)",
        marginTop: 4,
        marginBottom: 20,
        zIndex: 1,
    },

    // Cards
    sectionTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: Colors.text3,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 4,
    },
    featCard: {
        borderRadius: Radius.xl,
        borderWidth: 1.5,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        padding: 16,
        paddingLeft: 0,
        overflow: "hidden",
        ...Shadow.sm,
    },
    featCardDisabled: { opacity: 0.75 },
    accentBar: { width: 4, alignSelf: "stretch", borderRadius: 2 },
    featIconWrap: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    featIconEmoji: { fontSize: 24 },
    featTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 4,
    },
    featTitle: { fontSize: 16, fontWeight: "800" },
    featSub: { fontSize: 12, color: Colors.text2, lineHeight: 17 },
    soonBadge: {
        backgroundColor: Colors.amberBg,
        borderRadius: 6,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    soonTxt: { fontSize: 9, fontWeight: "800", color: Colors.amberText },
    arrowCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    arrow: { fontSize: 22, fontWeight: "300", marginLeft: 2 },
});
