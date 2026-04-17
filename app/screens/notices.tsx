import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Shadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { NOTICES } from '@/constants/data';

type NoticeType = 'urgent' | 'event' | 'general';

const TYPE_CONFIG: Record<NoticeType, { icon: string; bg: string; color: string; label: string }> = {
  urgent: { icon: '🚨', bg: Colors.redBg, color: Colors.redText, label: 'Urgent' },
  event: { icon: '📌', bg: Colors.purpleBg, color: Colors.purple, label: 'Event' },
  general: { icon: '📌', bg: Colors.blueBg, color: Colors.blueText, label: 'General' },
};

export default function NoticesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top }}>
      <ScreenHeader title="Notices" subtitle="School announcements" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg, gap: 10 }}>
        {NOTICES.map((n, i) => {
          const cfg = TYPE_CONFIG[n.type as NoticeType] || TYPE_CONFIG.general;
          return (
            <View key={i} style={styles.card}>
              <View style={[styles.tag, { backgroundColor: cfg.bg }]}>
                <Text style={styles.tagEmoji}>{cfg.icon}</Text>
                <Text style={[styles.tagText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
              <Text style={styles.title}>{n.title}</Text>
              <Text style={styles.body}>{n.body}</Text>
              <Text style={styles.date}>{n.date}</Text>
            </View>
          );
        })}
        <View style={{ height: 10 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: 14, padding: Spacing.lg,
    ...Shadow.sm, borderWidth: 1, borderColor: Colors.border,
  },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, marginBottom: 8,
  },
  tagEmoji: { fontSize: 11 },
  tagText: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: 15, fontWeight: '700', color: Colors.text1, marginBottom: 6 },
  body: { fontSize: 13, color: Colors.text2, lineHeight: 20 },
  date: { fontSize: 11, color: Colors.text3, marginTop: 10 },
});
