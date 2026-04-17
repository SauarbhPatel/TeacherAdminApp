import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { Colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync();

// ─── Inner navigator (needs AuthContext) ────────────────
function RootNavigator() {
    const { isLoggedIn, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            SplashScreen.hideAsync();
        }
    }, [isLoading]);

    if (isLoading) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: Colors.purple,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <ActivityIndicator color="#fff" size="large" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
            }}
        >
            {!isLoggedIn ? (
                <>
                    <Stack.Screen name="auth/login" />
                    <Stack.Screen name="auth/forgot-password" />
                </>
            ) : (
                <>
                    <Stack.Screen name="tabs" />
                    <Stack.Screen name="screens/attendance" />
                    <Stack.Screen name="screens/attendance-mark" />
                    <Stack.Screen name="screens/homework" />
                    <Stack.Screen name="screens/add-homework" />
                    <Stack.Screen name="screens/marks" />
                    <Stack.Screen name="screens/timetable" />
                    <Stack.Screen name="screens/notices" />
                    <Stack.Screen name="screens/attendance-confirm" />
                </>
            )}
        </Stack>
    );
}

// ─── Root (wraps in all providers) ──────────────────────
export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <StatusBar style="dark" />
                <AuthProvider>
                    <AppProvider>
                        <RootNavigator />
                    </AppProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
