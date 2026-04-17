import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

// ─── Card ──────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}
export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Badge ─────────────────────────────────────────────
type BadgeVariant = 'purple' | 'green' | 'red' | 'amber' | 'blue' | 'gray';
interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}
export function Badge({ label, variant = 'purple' }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
    purple: { bg: Colors.purpleBg, text: Colors.purple },
    green: { bg: Colors.greenBg, text: Colors.greenText },
    red: { bg: Colors.redBg, text: Colors.redText },
    amber: { bg: Colors.amberBg, text: Colors.amberText },
    blue: { bg: Colors.blueBg, text: Colors.blueText },
    gray: { bg: Colors.surface, text: Colors.text3 },
  };
  const v = variantStyles[variant];
  return (
    <View style={[styles.badge, { backgroundColor: v.bg }]}>
      <Text style={[styles.badgeText, { color: v.text }]}>{label}</Text>
    </View>
  );
}

// ─── Chip ──────────────────────────────────────────────
interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}
export function Chip({ label, active, onPress, style }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive, style]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── PrimaryButton ─────────────────────────────────────
interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}
export function PrimaryButton({ label, onPress, color, style, textStyle, icon }: PrimaryButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, { backgroundColor: color || Colors.purple }, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {icon ? <Text style={styles.primaryBtnIcon}>{icon}</Text> : null}
      <Text style={[styles.primaryBtnText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── SectionLabel ──────────────────────────────────────
interface SectionLabelProps {
  label: string;
  style?: TextStyle;
}
export function SectionLabel({ label, style }: SectionLabelProps) {
  return <Text style={[styles.sectionLabel, style]}>{label}</Text>;
}

// ─── AttendancePill ────────────────────────────────────
type AttStatus = 'P' | 'A' | 'L' | null;
interface AttPillProps {
  status: AttStatus;
  type: 'P' | 'A' | 'L';
  onPress: () => void;
}
export function AttPill({ status, type, onPress }: AttPillProps) {
  const isActive = status === type;
  const colors: Record<'P' | 'A' | 'L', { bg: string; text: string; activeBg: string; activeText: string }> = {
    P: { bg: Colors.surface, text: Colors.text3, activeBg: Colors.greenBg, activeText: Colors.greenText },
    A: { bg: Colors.surface, text: Colors.text3, activeBg: Colors.redBg, activeText: Colors.redText },
    L: { bg: Colors.surface, text: Colors.text3, activeBg: Colors.amberBg, activeText: Colors.amberText },
  };
  const c = colors[type];
  return (
    <TouchableOpacity
      style={[
        styles.attPill,
        { backgroundColor: isActive ? c.activeBg : c.bg },
        isActive && { borderColor: 'transparent' },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.attPillText, { color: isActive ? c.activeText : c.text }]}>{type}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.purple,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text2,
  },
  chipTextActive: {
    color: Colors.white,
  },
  primaryBtn: {
    borderRadius: Radius.lg,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  primaryBtnIcon: {
    fontSize: 16,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.text3,
    paddingHorizontal: Spacing.lg,
    paddingTop: 18,
    paddingBottom: Spacing.sm,
  },
  attPill: {
    width: 32,
    height: 32,
    borderRadius: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
