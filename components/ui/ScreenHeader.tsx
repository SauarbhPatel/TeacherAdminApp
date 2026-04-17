import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Colors, Spacing } from "@/constants/theme";

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
}

export function ScreenHeader({
    title,
    subtitle,
    onBack,
    rightElement,
}: ScreenHeaderProps) {
    return (
        <LinearGradient
            colors={[Colors.purple, Colors.purpleDeeper]}
            style={styles.header}
        >
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />

            <TouchableOpacity
                style={styles.backBtn}
                onPress={
                    onBack ||
                    (() =>
                        router.canGoBack()
                            ? router.replace("tabs")
                            : router.back())
                }
                activeOpacity={0.75}
            >
                <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            <View style={styles.row}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle ? (
                        <Text style={styles.subtitle}>{subtitle}</Text>
                    ) : null}
                </View>
                {rightElement}
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 14,
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl,
        position: "relative",
        overflow: "hidden",
    },
    decorCircle1: {
        position: "absolute",
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    decorCircle2: {
        position: "absolute",
        bottom: -50,
        left: 20,
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: Spacing.md,
        zIndex: 1,
    },
    backArrow: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: "600",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        zIndex: 1,
    },
    title: {
        fontSize: 19,
        fontWeight: "700",
        color: Colors.white,
    },
    subtitle: {
        fontSize: 12,
        color: "rgba(255,255,255,0.65)",
        marginTop: 2,
    },
});
