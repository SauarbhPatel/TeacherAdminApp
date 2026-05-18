/**
 * app/screens/profile.tsx  ← MOVED from app/tabs/profile.tsx
 *
 * Full profile screen. Accessed via home header avatar button.
 * Has back button (← ) since it's now a stack screen, not a tab.
 */

import React from "react";
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";
import { Card } from "@/components/ui";

const MENU_ITEMS = [
    { icon: "👤", label: "Personal Information", sub: "Name, contact, address" },
    { icon: "🔔", label: "Notifications",        sub: "Alerts, reminders, SMS" },
    { icon: "🔒", label: "Change Password",      sub: "Update your credentials" },
    { icon: "📋", label: "My Classes",           sub: "View all assigned classes" },
    { icon: "📊", label: "Performance Reports",  sub: "Class analytics & trends" },
    { icon: "❓", label: "Help & Support",       sub: "FAQs, contact admin" },
    { icon: "📜", label: "Privacy Policy",       sub: "Data usage & terms" },
];

export default function ProfileScreen() {
    const insets = useSafeAreaInsets();
    const { user, logout } = useAuth();
    const record = user?.record;

    const initials = record?.name
        ? record.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
        : "T";

    const handleLogout = () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    await logout();
                    router.replace("/auth/login");
                },
            },
        ]);
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
            {/* ── Header ── */}
            <LinearGradient
                colors={[Colors.purple, Colors.purpleDeeper]}
                style={[styles.header, { paddingTop: insets.top + 14 }]}
            >
                <View style={styles.decorCircle} />

                {/* Back button row */}
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
                        <Text style={styles.backArrow}>←</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <View style={{ width: 34 }} />{/* spacer to centre title */}
                </View>

                {/* Avatar */}
                <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <Text style={styles.name}>{record?.name ?? "Teacher"}</Text>
                    <Text style={styles.role}>{record?.role ?? user?.role ?? "Staff"}</Text>
                    {record?.employee_id ? (
                        <View style={styles.empBadge}>
                            <Text style={styles.empId}>{record.employee_id}</Text>
                        </View>
                    ) : null}
                </View>
            </LinearGradient>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>

                {/* Stats row */}
                <View style={styles.infoRow}>
                    {[
                        { icon: "🏫", label: "School", val: record?.school_id ? `ID ${record.school_id}` : "–" },
                        { icon: "📚", label: "Classes", val: "5" },
                        { icon: "👩‍🎓", label: "Students", val: "148" },
                    ].map((item, i) => (
                        <Card key={i} style={styles.infoCard}>
                            <Text style={styles.infoIcon}>{item.icon}</Text>
                            <Text style={styles.infoVal}>{item.val}</Text>
                            <Text style={styles.infoLabel}>{item.label}</Text>
                        </Card>
                    ))}
                </View>

                {/* Account details */}
                <Card style={styles.accountCard}>
                    <Text style={styles.sectionLabel}>Account Details</Text>
                    {[
                        { icon: "✉️", label: "Email",        val: record?.email      ?? "–" },
                        { icon: "📱", label: "Contact",      val: record?.contact_no ?? "–" },
                        { icon: "🎂", label: "Date of Birth",val: record?.dob        ?? "–" },
                        { icon: "⚧️", label: "Gender",       val: record?.gender     ?? "–" },
                        { icon: "🏷️", label: "Role",         val: record?.role ?? user?.role ?? "–" },
                    ].map((row, i) => (
                        <View key={i} style={[styles.detailRow, i > 0 && styles.detailBorder]}>
                            <Text style={styles.detailIcon}>{row.icon}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.detailKey}>{row.label}</Text>
                                <Text style={styles.detailVal}>{row.val}</Text>
                            </View>
                        </View>
                    ))}
                </Card>

                {/* Menu items */}
                <Card style={styles.menuCard}>
                    {MENU_ITEMS.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.menuRow, i < MENU_ITEMS.length - 1 && styles.menuBorder]}
                            activeOpacity={0.7}
                        >
                            <View style={styles.menuIconWrap}>
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.menuLabel}>{item.label}</Text>
                                <Text style={styles.menuSub}>{item.sub}</Text>
                            </View>
                            <Text style={styles.menuChevron}>›</Text>
                        </TouchableOpacity>
                    ))}
                </Card>

                {/* Token (dev) */}
                {user?.token ? (
                    <View style={styles.tokenCard}>
                        <Text style={styles.tokenLabel}>Session Token (dev)</Text>
                        <Text style={styles.tokenVal} numberOfLines={2}>
                            {user.token.slice(0, 60)}…
                        </Text>
                    </View>
                ) : null}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <Text style={styles.logoutText}>🚪  Sign Out</Text>
                </TouchableOpacity>

                {/* <Text style={styles.version}>TeachDesk v1.0.0</Text> */}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, position: "relative", overflow: "hidden" },
    decorCircle: { position: "absolute", top: -60, right: -50, width: 220, height: 220, borderRadius: 110, backgroundColor: "rgba(255,255,255,0.06)" },
    headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, zIndex: 1 },
    backBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
    backArrow: { color: "#fff", fontSize: 18, fontWeight: "700" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
    avatarWrap: { alignItems: "center", zIndex: 1 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 10, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)" },
    avatarText: { fontSize: 28, fontWeight: "900", color: "#fff" },
    name: { fontSize: 20, fontWeight: "800", color: "#fff" },
    role: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 3 },
    empBadge: { marginTop: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
    empId: { fontSize: 12, fontWeight: "700", color: "#fff" },
    infoRow: { flexDirection: "row", gap: 10, padding: Spacing.lg, paddingBottom: 0 },
    infoCard: { flex: 1, alignItems: "center", paddingVertical: 14 },
    infoIcon: { fontSize: 22, marginBottom: 4 },
    infoVal: { fontSize: 16, fontWeight: "800", color: Colors.text1 },
    infoLabel: { fontSize: 10, color: Colors.text3, marginTop: 2 },
    // accountCard: { marginHorizontal: Spacing.lg, marginTop: 12, marginBottom: 0 },
    // sectionLabel: { fontSize: 11, fontWeight: "700", color: Colors.text3, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
    // detailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
    // detailBorder: { borderTopWidth: 1, borderTopColor: Colors.border },
    // detailIcon: { fontSize: 18, width: 26, textAlign: "center" },
    // detailKey: { fontSize: 11, color: Colors.text3, fontWeight: "600" },
    // detailVal: { fontSize: 13, fontWeight: "700", color: Colors.text1, marginTop: 2 },

     accountCard: {
        marginHorizontal: Spacing.lg,
       marginTop: 12, marginBottom: 0 ,
        padding: Spacing.lg,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.text3,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingVertical: 8,
    },
    detailBorder: { borderTopWidth: 1, borderTopColor: Colors.surface },
    detailIcon: { fontSize: 16, marginTop: 1 },
    detailKey: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.text3,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    detailVal: {
        fontSize: 13,
        fontWeight: "600",
        color: Colors.text1,
        marginTop: 2,
    },
    menuCard: { marginHorizontal: Spacing.lg, marginTop: 12, marginBottom: 0, overflow: "hidden" },
    menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: Spacing.lg, gap: 12 },
    menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
    menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center" },
    menuIcon: { fontSize: 16 },
    menuLabel: { fontSize: 13, fontWeight: "600", color: Colors.text1 },
    menuSub: { fontSize: 11, color: Colors.text3, marginTop: 1 },
    menuChevron: { fontSize: 20, color: Colors.text3 },
    tokenCard: { marginHorizontal: Spacing.lg, marginTop: 12, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    tokenLabel: { fontSize: 10, color: Colors.text3, fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
    tokenVal: { fontSize: 11, color: Colors.text2, fontFamily: "monospace" },
    logoutBtn: { marginHorizontal: Spacing.lg, marginTop: 12, marginBottom: 8, backgroundColor: Colors.redBg, borderRadius: Radius.lg, padding: 15, alignItems: "center", borderWidth: 1, borderColor: "#fcc" },
    logoutText: { fontSize: 14, fontWeight: "700", color: Colors.redText },
    version: { textAlign: "center", fontSize: 11, color: Colors.text3, marginBottom: 10 },
});