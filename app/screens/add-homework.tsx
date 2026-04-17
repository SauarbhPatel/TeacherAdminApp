import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { Colors, Spacing, Radius, Shadow } from '@/constants/theme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PrimaryButton } from '@/components/ui';

const CLASS_OPTIONS = [
  { value: '5A', label: 'Class 5-A – Mathematics' },
  { value: '6B', label: 'Class 6-B – Science' },
  { value: '4C', label: 'Class 4-C – English' },
];
const TYPE_OPTIONS = ['Written', 'Reading', 'Project', 'Practical', 'Revision'];

export default function AddHomeworkScreen() {
  const insets = useSafeAreaInsets();
  const { addHomework } = useAppContext();

  const [selectedClass, setSelectedClass] = useState('5A');
  const [subject, setSubject] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('Apr 10');
  const [selectedType, setSelectedType] = useState('Written');

  const handleSave = () => {
    if (!subject.trim()) {
      Alert.alert('Missing Info', 'Please enter a subject/title for the homework.');
      return;
    }
    const clsData = CLASS_OPTIONS.find(c => c.value === selectedClass);
    const clsName = clsData?.label.split('–')[0].trim() || 'Class';
    const subName = clsData?.label.split('–')[1]?.trim() || 'Subject';
    addHomework({
      cls: clsName,
      sub: subName,
      title: subject.trim(),
      desc: desc.trim() || 'Complete as instructed.',
      due: dueDate,
      tag: selectedType,
    });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface, paddingTop: insets.top }}>
      <ScreenHeader title="Assign Homework" subtitle="Create new assignment" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: Spacing.lg }}>
        {/* Class Selector */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Class</Text>
          <View style={styles.optionRow}>
            {CLASS_OPTIONS.map(c => (
              <TouchableOpacity
                key={c.value}
                style={[styles.option, selectedClass === c.value && styles.optionActive]}
                onPress={() => setSelectedClass(c.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, selectedClass === c.value && styles.optionTextActive]}>
                  {c.label.split('–')[0].trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Subject/Title */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Title / Topic</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="e.g. Chapter 5 – Fractions"
            placeholderTextColor={Colors.text3}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={desc}
            onChangeText={setDesc}
            placeholder="Describe the assignment…"
            placeholderTextColor={Colors.text3}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Due Date */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Due Date</Text>
          <TextInput
            style={styles.input}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="e.g. Apr 10"
            placeholderTextColor={Colors.text3}
          />
        </View>

        {/* Type */}
        <View style={styles.fieldWrap}>
          <Text style={styles.label}>Assignment Type</Text>
          <View style={styles.typeGrid}>
            {TYPE_OPTIONS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.typeChip, selectedType === t && styles.typeChipActive]}
                onPress={() => setSelectedType(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeText, selectedType === t && styles.typeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={styles.btnStrip}>
        <PrimaryButton label="Save Assignment" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrap: { marginBottom: 18 },
  label: {
    fontSize: 11, fontWeight: '700', color: Colors.text2,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  optionRow: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1, borderRadius: Radius.md, padding: 10,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  optionActive: { backgroundColor: Colors.purpleBg, borderColor: Colors.purple },
  optionText: { fontSize: 11, fontWeight: '600', color: Colors.text2 },
  optionTextActive: { color: Colors.purple },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5,
    borderColor: Colors.border, padding: 12, fontSize: 14, color: Colors.text1,
  },
  textarea: { height: 90, textAlignVertical: 'top' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  typeChipActive: { backgroundColor: Colors.purpleBg, borderColor: Colors.purple },
  typeText: { fontSize: 12, fontWeight: '600', color: Colors.text2 },
  typeTextActive: { color: Colors.purple },
  btnStrip: { padding: Spacing.lg, backgroundColor: Colors.card, borderTopWidth: 1, borderTopColor: Colors.border },
});
