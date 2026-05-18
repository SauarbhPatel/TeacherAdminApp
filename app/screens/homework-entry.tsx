/**
 * homework-entry.tsx
 *
 * Homework entry form for a selected class + section.
 * - Shared date fields: homework_date, from_date, to_date, submit_date
 * - Per-subject: description textarea, upload doc (static UI), upload image (static UI)
 * - "Copy to another section" modal — shows sibling sections, multi-select
 * - Save via saveHomeworkByStaff API
 * - SaveToast on success
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Animated,
    Modal,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { saveHomeworkByStaff } from "@/services/api";
import { Colors, Spacing, Radius, Shadow } from "@/constants/theme";
import { StatusBar } from "expo-status-bar";

// ─── Types ────────────────────────────────────────────────
interface HomeworkItem {
    id: string;
    subject_id: string;
    subject_name: string;
    homework_date: string | null;
    from_date: string | null;
    to_date: string | null;
    submit_date: string | null;
    description: string | null;
    document: string | null;
    image: string | null;
    class_id: string;
    section_id: string;
}

interface SectionRef {
    section_id: string;
    section_name: string;
}

interface LocalSubject {
    subject_id: string;
    subject_name: string;
    description: string;
    document: string; // static for now
    image: string; // static for now
}

// ─── Helpers ──────────────────────────────────────────────
function todayISO(): string {
    return new Date().toISOString().split("T")[0];
}
function addDays(iso: string, n: number): string {
    const d = new Date(iso + "T00:00:00");
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
}
function formatDisplay(iso: string): string {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
}

// ─── Save Toast ───────────────────────────────────────────
function SaveToast({ visible }: { visible: boolean }) {
    const opacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(opacity, {
            toValue: visible ? 1 : 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [visible]);
    return (
        <Animated.View style={[toastS.wrap, { opacity }]} pointerEvents="none">
            <Text style={toastS.txt}>✓ Homework saved</Text>
        </Animated.View>
    );
}
const toastS = StyleSheet.create({
    wrap: {
        position: "absolute",
        bottom: 32,
        alignSelf: "center",
        backgroundColor: Colors.green,
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingVertical: 8,
        zIndex: 999,
        shadowColor: Colors.green,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    txt: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

// ─── Date Picker Field ────────────────────────────────────
function DateField({
    label,
    value,
    onChange,
    required,
}: {
    label: string;
    value: string; // YYYY-MM-DD
    onChange: (v: string) => void;
    required?: boolean;
}) {
    const [show, setShow] = useState(false);
    // Parse ISO → Date for the picker
    const dateObj = value ? new Date(value + "T00:00:00") : new Date();

    const onPickerChange = (_: DateTimePickerEvent, selected?: Date) => {
        if (Platform.OS === "android") setShow(false);
        // if (selected) {
        //     const iso = selected.toISOString().split("T")[0];
        //     onChange(iso);
        // }

        if (selected) {
            const year = selected.getFullYear();
            const month = String(selected.getMonth() + 1).padStart(2, "0");
            const day = String(selected.getDate()).padStart(2, "0");

            const iso = `${year}-${month}-${day}`;
            onChange(iso);
        }
    };

    return (
        <View style={df.wrap}>
            <Text style={df.label}>
                {label}
                {required ? " *" : ""}
            </Text>
            <TouchableOpacity
                style={df.inputRow}
                onPress={() => setShow(true)}
                activeOpacity={0.8}
            >
                <Text style={{ fontSize: 16 }}>📅</Text>
                <Text style={[df.dateText, !value && { color: Colors.text3 }]}>
                    {value ? formatDisplay(value) : "Pick a date"}
                </Text>
                <Text style={df.chevron}>›</Text>
            </TouchableOpacity>

            {/* iOS shows inline; Android shows modal */}
            {show && (
                <DateTimePicker
                    value={dateObj}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onPickerChange}
                    onTouchCancel={() => setShow(false)}
                />
            )}
            {/* iOS: done button to dismiss */}
            {show && Platform.OS === "ios" && (
                <TouchableOpacity
                    style={df.doneBtn}
                    onPress={() => setShow(false)}
                >
                    <Text style={df.doneTxt}>Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
const df = StyleSheet.create({
    wrap: { marginBottom: 12 },
    label: {
        fontSize: 11,
        fontWeight: "700",
        color: Colors.text2,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    dateText: { flex: 1, fontSize: 14, fontWeight: "700", color: Colors.text1 },
    chevron: { fontSize: 18, color: Colors.text3 },
    doneBtn: {
        alignSelf: "flex-end",
        marginTop: 6,
        backgroundColor: Colors.green,
        borderRadius: 8,
        paddingHorizontal: 20,
        paddingVertical: 6,
    },
    doneTxt: { color: "#fff", fontWeight: "800", fontSize: 13 },
});

// ─── Static Upload Button ─────────────────────────────────
function UploadBtn({
    label,
    icon,
    onPress,
}: {
    label: string;
    icon: string;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity style={ub.btn} onPress={onPress} activeOpacity={0.8}>
            <Text style={{ fontSize: 18 }}>{icon}</Text>
            <Text style={ub.txt}>{label}</Text>
        </TouchableOpacity>
    );
}
const ub = StyleSheet.create({
    btn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderStyle: "dashed",
        paddingVertical: 12,
    },
    txt: { fontSize: 12, fontWeight: "700", color: Colors.text2 },
});

// ─── Copy to Section Modal ────────────────────────────────
function CopyModal({
    visible,
    sections,
    currentSectionId,
    onClose,
    onConfirm,
}: {
    visible: boolean;
    sections: SectionRef[];
    currentSectionId: string;
    onClose: () => void;
    onConfirm: (ids: string[]) => void;
}) {
    const [selected, setSelected] = useState<string[]>([]);
    const others = sections.filter((s) => s.section_id !== currentSectionId);

    const toggle = (id: string) =>
        setSelected((p) =>
            p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
        );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={cm.overlay}>
                <View style={cm.sheet}>
                    <View style={cm.handle} />
                    <Text style={cm.title}>Copy to Sections</Text>
                    <Text style={cm.sub}>
                        Homework will be saved to selected sections with same
                        dates & descriptions.
                    </Text>

                    {others.length === 0 ? (
                        <Text
                            style={{
                                color: Colors.text3,
                                textAlign: "center",
                                marginVertical: 20,
                            }}
                        >
                            No other sections in this class.
                        </Text>
                    ) : (
                        <ScrollView
                            style={{ maxHeight: 280 }}
                            contentContainerStyle={{
                                gap: 8,
                                paddingVertical: 8,
                            }}
                        >
                            {others.map((s) => {
                                const isSel = selected.includes(s.section_id);
                                return (
                                    <TouchableOpacity
                                        key={s.section_id}
                                        style={[
                                            cm.secRow,
                                            isSel && cm.secRowSel,
                                        ]}
                                        onPress={() => toggle(s.section_id)}
                                        activeOpacity={0.8}
                                    >
                                        <View
                                            style={[
                                                cm.checkbox,
                                                isSel && cm.checkboxSel,
                                            ]}
                                        >
                                            {isSel && (
                                                <Text
                                                    style={{
                                                        color: "#fff",
                                                        fontSize: 12,
                                                        fontWeight: "900",
                                                    }}
                                                >
                                                    ✓
                                                </Text>
                                            )}
                                        </View>
                                        <Text
                                            style={[
                                                cm.secName,
                                                isSel && {
                                                    color: Colors.green,
                                                },
                                            ]}
                                        >
                                            Section {s.section_name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}

                    <View
                        style={{ flexDirection: "row", gap: 10, marginTop: 16 }}
                    >
                        <TouchableOpacity
                            style={cm.cancelBtn}
                            onPress={() => {
                                setSelected([]);
                                onClose();
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={cm.cancelTxt}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                cm.confirmBtn,
                                selected.length === 0 && { opacity: 0.5 },
                            ]}
                            onPress={() => {
                                if (selected.length > 0) {
                                    onConfirm(selected);
                                    setSelected([]);
                                }
                            }}
                            disabled={selected.length === 0}
                            activeOpacity={0.8}
                        >
                            <Text style={cm.confirmTxt}>
                                Copy to {selected.length} Section
                                {selected.length !== 1 ? "s" : ""}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
const cm = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: Colors.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: Colors.text1,
        marginBottom: 4,
    },
    sub: {
        fontSize: 12,
        color: Colors.text3,
        lineHeight: 18,
        marginBottom: 12,
    },
    secRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: Radius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    secRowSel: {
        backgroundColor: Colors.greenBg,
        borderColor: Colors.green + "60",
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxSel: { backgroundColor: Colors.green, borderColor: Colors.green },
    secName: { fontSize: 14, fontWeight: "700", color: Colors.text1 },
    cancelBtn: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelTxt: { fontSize: 14, fontWeight: "700", color: Colors.text2 },
    confirmBtn: {
        flex: 2,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
        backgroundColor: Colors.green,
    },
    confirmTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
});

// ═══════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════
export default function HomeworkEntryScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const params = useLocalSearchParams<{
        class_id: string;
        class_name: string;
        section_id: string;
        section_name: string;
        all_sections: string;
        existing_homework: string;
    }>();

    const { class_id, class_name, section_id, section_name } = params;
    const allSections: SectionRef[] = JSON.parse(params.all_sections ?? "[]");
    const existingHomework: HomeworkItem[] = JSON.parse(
        params.existing_homework ?? "[]",
    );

    // ── Shared date state ────────────────────────────────────
    // fromDate always mirrors hwDate (no separate UI)
    // toDate + submitDate revealed by "More dates" toggle
    const today = todayISO();
    const [hwDate, setHwDate] = useState(today);
    const [toDate, setToDate] = useState(today);
    const [submitDate, setSubmitDate] = useState(addDays(today, 1));
    const fromDate = hwDate; // always same as homework date
    const [showMoreDates, setShowMoreDates] = useState(false);

    // When hwDate changes → sync toDate + submitDate only if user hasn't manually changed them
    const toDateTouched = useRef(false);
    const submitDateTouched = useRef(false);

    const handleHwDateChange = useCallback((v: string) => {
        setHwDate(v);
        if (!toDateTouched.current) setToDate(v);
        if (!submitDateTouched.current) setSubmitDate(addDays(v, 1));
    }, []);

    const handleToDateChange = useCallback((v: string) => {
        toDateTouched.current = true;
        setToDate(v);
    }, []);

    const handleSubmitDateChange = useCallback((v: string) => {
        submitDateTouched.current = true;
        console.log(v);
        setSubmitDate(v);
    }, []);

    // ── Per-subject state (initialised from existing homework) ─
    const [subjects, setSubjects] = useState<LocalSubject[]>(() =>
        existingHomework.map((hw) => ({
            subject_id: hw.subject_id,
            subject_name: hw.subject_name,
            description: hw.description ?? "",
            document: hw.document ?? "",
            image: hw.image ?? "",
        })),
    );

    // ── Copy modal ───────────────────────────────────────────
    const [showCopy, setShowCopy] = useState(false);

    // ── Save state ───────────────────────────────────────────
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashToast = useCallback(() => {
        if (toastTimer.current) clearTimeout(toastTimer.current);
        setShowToast(true);
        toastTimer.current = setTimeout(() => setShowToast(false), 1800);
    }, []);

    // ── Update description ───────────────────────────────────
    const updateDesc = useCallback((subjectId: string, desc: string) => {
        setSubjects((prev) =>
            prev.map((s) =>
                s.subject_id === subjectId ? { ...s, description: desc } : s,
            ),
        );
    }, []);

    // ── Validate ─────────────────────────────────────────────
    const validate = (): string | null => {
        if (!hwDate) return "Homework date is required.";
        if (!toDate) return "To date is required.";
        if (!submitDate) return "Submission date is required.";
        return null;
    };

    // ── Save for one section ─────────────────────────────────
    const saveForSection = async (sec_id: string): Promise<boolean> => {
        if (!user?.token || !user.record) return false;

        const res = await saveHomeworkByStaff(
            {
                school_id: user.record.school_id,
                session_id: (user.record as any).session_id ?? 22,
                class_id,
                section_id: sec_id,
                homework_date: hwDate,
                from_date: fromDate,
                to_date: toDate,
                submit_date: submitDate,
                subjects: subjects?.filter(s=>s.description).map((s) => ({
                    subject_id: parseInt(s.subject_id),
                    description: s.description,
                    document: s.document,
                    image: s.image,
                })),
            },
            user.token,
        );
        return res.response_code === 200;
    };

    // ── Main save ────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        const err = validate();
        if (err) {
            Alert.alert("Validation", err);
            return;
        }
        setSaving(true);
        try {
            const ok = await saveForSection(section_id);
            if (ok) {
                flashToast();
            } else {
                Alert.alert(
                    "Save Failed",
                    "Could not save homework. Try again.",
                );
            }
        } catch (e: any) {
            Alert.alert(
                "Network Error",
                e?.message || "Check your connection.",
            );
        } finally {
            setSaving(false);
        }
    }, [validate, section_id, flashToast]);

    // ── Copy to sections ─────────────────────────────────────
    const handleCopy = useCallback(
        async (sectionIds: string[]) => {
            setShowCopy(false);
            const err = validate();
            if (err) {
                Alert.alert("Validation", err);
                return;
            }
            setSaving(true);
            let successCount = 0;
            for (const sid of sectionIds) {
                try {
                    const ok = await saveForSection(sid);
                    if (ok) successCount++;
                } catch {}
            }
            setSaving(false);
            if (successCount > 0) {
                flashToast();
                Alert.alert(
                    "Copy Complete",
                    `Homework copied to ${successCount} section${successCount !== 1 ? "s" : ""}.`,
                );
            } else {
                Alert.alert("Copy Failed", "Could not copy to any section.");
            }
        },
        [validate, saveForSection, flashToast],
    );

    const filledCount = subjects.filter((s) => s.description.trim()).length;
    return (
        <View style={{ flex: 1, backgroundColor: Colors.surface }}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                {/* Header */}
                <LinearGradient
                    colors={[Colors.green, "#0a8a50"]}
                    style={[styles.header, { paddingTop: insets.top + 14 }]}
                >
                    <View style={styles.decor1} />
                    <View style={styles.decor2} />
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.backBtn}
                            onPress={() => router.back()}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                Class {class_name} · Section {section_name}
                            </Text>
                            <Text style={styles.headerSub}>
                                {filledCount}/{subjects.length} subjects filled
                            </Text>
                        </View>
                    </View>
                    {/* Summary pills */}
                    <View style={styles.summaryRow}>
                        <View style={styles.summaryPill}>
                            <Text style={styles.sumNum}>{subjects.length}</Text>
                            <Text style={styles.sumLbl}>Subjects</Text>
                        </View>
                        <View style={styles.summaryPill}>
                            <Text style={[styles.sumNum, { color: "#4ade80" }]}>
                                {filledCount}
                            </Text>
                            <Text style={styles.sumLbl}>Filled</Text>
                        </View>
                        <View style={styles.summaryPill}>
                            <Text style={[styles.sumNum, { color: "#fbbf24" }]}>
                                {subjects.length - filledCount}
                            </Text>
                            <Text style={styles.sumLbl}>Pending</Text>
                        </View>
                        <View style={styles.summaryPill}>
                            <Text style={[styles.sumNum, { color: "#c4b5fd" }]}>
                                {allSections.length}
                            </Text>
                            <Text style={styles.sumLbl}>Sections</Text>
                        </View>
                    </View>
                </LinearGradient>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        padding: Spacing.lg,
                        paddingBottom: 80,
                    }}
                    style={{ flex: 1 }}
                >
                    {/* ── Date fields ── */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>📅 Dates</Text>

                        {/* Homework Date + toggle button on same row */}
                        <View style={styles.hwDateRow}>
                            <View style={{ flex: 1 }}>
                                <DateField
                                    label="From Date"
                                    value={hwDate}
                                    onChange={handleHwDateChange}
                                    required
                                />
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.toggleBtn,
                                    showMoreDates && styles.toggleBtnActive,
                                ]}
                                onPress={() => setShowMoreDates((p) => !p)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.toggleBtnIcon,
                                        showMoreDates && {
                                            color: Colors.green,
                                        },
                                    ]}
                                >
                                    {showMoreDates ? "▲" : "▼"}
                                </Text>
                                <Text
                                    style={[
                                        styles.toggleBtnTxt,
                                        showMoreDates && {
                                            color: Colors.green,
                                        },
                                    ]}
                                >
                                    {showMoreDates ? "Less" : "More\nDates"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Collapsible: Submit Date + To Date */}
                        {showMoreDates && (
                            <View style={styles.dateGrid}>
                                <View style={{ flex: 1 }}>
                                    <DateField
                                        label="To Date"
                                        value={toDate}
                                        onChange={handleToDateChange}
                                        required
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <DateField
                                        label="Submit Date"
                                        value={submitDate}
                                        onChange={handleSubmitDateChange}
                                        required
                                    />
                                </View>
                            </View>
                        )}

                        {/* Summary chips when collapsed */}
                        {/* {!showMoreDates && (
                            <View style={styles.dateSummaryRow}>
                                <View style={styles.dateSummaryChip}>
                                    <Text style={styles.dateSummaryLbl}>
                                        To
                                    </Text>
                                    <Text style={styles.dateSummaryVal}>
                                        {formatDisplay(toDate)}
                                    </Text>
                                </View>
                                <View style={styles.dateSummaryChip}>
                                    <Text style={styles.dateSummaryLbl}>
                                        Submit
                                    </Text>
                                    <Text style={styles.dateSummaryVal}>
                                        {formatDisplay(submitDate)}
                                    </Text>
                                </View>
                            </View>
                        )} */}
                    </View>

                    {/* ── Per-subject cards ── */}
                    <Text style={styles.sectionTitle}>📚 Subjects</Text>
                    {subjects.length === 0 && (
                        <View style={styles.emptyWrap}>
                            <Text style={{ fontSize: 36, marginBottom: 10 }}>
                                📭
                            </Text>
                            <Text
                                style={{
                                    color: Colors.text3,
                                    fontSize: 14,
                                }}
                            >
                                No subjects assigned to this section
                            </Text>
                        </View>
                    )}
                    {subjects.map((subject, i) => {
                        const filled = subject.description.trim().length > 0;
                        return (
                            <View
                                key={subject.subject_id}
                                style={[
                                    styles.subjectCard,
                                    filled && styles.subjectCardFilled,
                                ]}
                            >
                                {/* Card top */}
                                <View style={styles.subjectHeader}>
                                    <View
                                        style={[
                                            styles.subjectIcon,
                                            {
                                                backgroundColor: filled
                                                    ? Colors.greenBg
                                                    : Colors.surface,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.subjectInitial,
                                                {
                                                    color: filled
                                                        ? Colors.green
                                                        : Colors.text3,
                                                },
                                            ]}
                                        >
                                            {subject.subject_name[0]}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.subjectName}>
                                            {subject.subject_name}
                                        </Text>
                                    </View>
                                    {filled && (
                                        <View style={styles.filledBadge}>
                                            <Text style={styles.filledBadgeTxt}>
                                                Ready
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Description */}
                                {/* <Text style={styles.fieldLabel}>
                                    Description
                                </Text> */}
                                <TextInput
                                    style={[
                                        styles.descInput,
                                        filled && styles.descInputFilled,
                                    ]}
                                    value={subject.description}
                                    onChangeText={(v) =>
                                        updateDesc(subject.subject_id, v)
                                    }
                                    placeholder={`Enter homework for ${subject.subject_name}…`}
                                    placeholderTextColor={Colors.text3}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />

                                {/* Upload buttons (static UI) */}
                                {/* <Text
                                    style={[
                                        styles.fieldLabel,
                                        { marginTop: 10 },
                                    ]}
                                >
                                    Attachments
                                </Text>
                                <View style={styles.uploadRow}>
                                    <UploadBtn
                                        label="Upload Document"
                                        icon="📄"
                                        onPress={() =>
                                            Alert.alert(
                                                "Coming Soon",
                                                "Document upload will be available once the API is ready.",
                                            )
                                        }
                                    />
                                    <UploadBtn
                                        label="Upload Image"
                                        icon="🖼️"
                                        onPress={() =>
                                            Alert.alert(
                                                "Coming Soon",
                                                "Image upload will be available once the API is ready.",
                                            )
                                        }
                                    />
                                </View> */}
                            </View>
                        );
                    })}
                </ScrollView>
            </KeyboardAvoidingView>
            {/* Bottom action strip */}
            <View style={styles.footer}>
                {/* Copy to section button */}
                <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={() => setShowCopy(true)}
                    activeOpacity={0.8}
                    disabled={saving}
                >
                    <Text style={{ fontSize: 16 }}>📋</Text>
                    <Text style={styles.copyBtnTxt}>Copy to Section</Text>
                </TouchableOpacity>

                {/* Save button */}
                <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={saving}
                    activeOpacity={0.85}
                >
                    <LinearGradient
                        colors={[Colors.green, "#0a8a50"]}
                        style={styles.saveBtnGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {saving ? (
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.saveBtnTxt}>Saving…</Text>
                            </View>
                        ) : (
                            <Text style={styles.saveBtnTxt}>Save Homework</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Copy modal */}
            <CopyModal
                visible={showCopy}
                sections={allSections}
                currentSectionId={section_id}
                onClose={() => setShowCopy(false)}
                onConfirm={handleCopy}
            />

            <SaveToast visible={showToast} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        position: "relative",
        overflow: "hidden",
    },
    decor1: {
        position: "absolute",
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    decor2: {
        position: "absolute",
        bottom: -50,
        left: 10,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
        zIndex: 1,
    },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    backArrow: { color: "#fff", fontSize: 18, fontWeight: "700" },
    headerTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },
    summaryRow: { flexDirection: "row", gap: 8, zIndex: 1 },
    summaryPill: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.14)",
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
    },
    sumNum: { fontSize: 15, fontWeight: "900", color: "#fff" },
    sumLbl: {
        fontSize: 9,
        fontWeight: "600",
        color: "rgba(255,255,255,0.65)",
        marginTop: 2,
    },
    section: { marginBottom: 8 },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "800",
        color: Colors.text1,
        marginBottom: 12,
        letterSpacing: 0.3,
    },
    dateGrid: { flexDirection: "row", gap: 10 },
    hwDateRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 10,
        marginBottom: 0,
    },
    toggleBtn: {
        width: 52,
        height: 52,
        borderRadius: Radius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        gap: 2,
    },
    toggleBtnActive: {
        backgroundColor: Colors.greenBg,
        borderColor: Colors.green + "60",
    },
    toggleBtnIcon: { fontSize: 10, fontWeight: "900", color: Colors.text3 },
    toggleBtnTxt: {
        fontSize: 8,
        fontWeight: "700",
        color: Colors.text3,
        textAlign: "center",
        lineHeight: 11,
    },
    dateSummaryRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
    dateSummaryChip: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: Colors.greenBg,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    dateSummaryLbl: {
        fontSize: 9,
        fontWeight: "700",
        color: Colors.text3,
        textTransform: "uppercase",
    },
    dateSummaryVal: {
        fontSize: 11,
        fontWeight: "800",
        color: Colors.greenText,
    },
    emptyWrap: { alignItems: "center", paddingTop: 40 },
    // Subject cards
    subjectCard: {
        backgroundColor: Colors.card,
        borderRadius: Radius.xl,
        ...Shadow.sm,
        borderWidth: 1.5,
        borderColor: Colors.border,
        marginBottom: 12,
        padding: Spacing.lg,
    },
    subjectCardFilled: { borderColor: Colors.greenBg },
    subjectHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    subjectIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    subjectInitial: { fontSize: 16, fontWeight: "900" },
    subjectName: { fontSize: 14, fontWeight: "800", color: Colors.text1 },
    subjectStatus: { fontSize: 11, fontWeight: "600", marginTop: 2 },
    filledBadge: {
        backgroundColor: Colors.greenBg,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    filledBadgeTxt: {
        fontSize: 10,
        fontWeight: "800",
        color: Colors.greenText,
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: Colors.text3,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginBottom: 6,
    },
    descInput: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: 12,
        fontSize: 13,
        color: Colors.text1,
        minHeight: 80,
    },
    descInputFilled: { borderColor: Colors.green + "60" },
    uploadRow: { flexDirection: "row", gap: 8 },
    // Footer
    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        gap: 10,
        padding: Spacing.lg,
        backgroundColor: Colors.card,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    copyBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: Colors.greenBg,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.green + "40",
    },
    copyBtnTxt: { fontSize: 12, fontWeight: "700", color: Colors.greenText },
    saveBtn: { flex: 1, borderRadius: 12, overflow: "hidden", ...Shadow.sm },
    saveBtnGrad: {
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    saveBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
