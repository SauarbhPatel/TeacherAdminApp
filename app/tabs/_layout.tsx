import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/theme";

function TabIcon({
    emoji,
    label,
    focused,
}: {
    emoji: string;
    label: string;
    focused: boolean;
}) {
    return (
        <View style={styles.tabItem}>
            <Text style={styles.tabEmoji}>{emoji}</Text>
            <Text
                style={[styles.tabLabel, focused && { color: Colors.purple }]}
            >
                {label}
            </Text>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="🏠" label="Home" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="✅" label="Attend" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="homework"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="📚" label="HW" focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="schedule"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon
                            emoji="🗓️"
                            label="Schedule"
                            focused={focused}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    tabBarIcon: ({ focused }) => (
                        <TabIcon emoji="👤" label="Profile" focused={focused} />
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.white,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        paddingTop: 15,
        paddingBottom: 18,
        height: 68,
    },
    tabItem: {
        alignItems: "center",
        gap: 2,
        width: 70,
    },
    tabEmoji: { fontSize: 20 },
    tabLabel: {
        fontSize: 10,
        fontWeight: "600",
        color: Colors.text3,
    },
});
