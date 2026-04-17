import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Radius, Spacing, Shadow } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSent(true);
  };

  return (
    <LinearGradient
      colors={['#c9a8f5', '#8b4ee0', '#6722d5', '#3a0f80']}
      style={{ flex: 1 }}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🔑</Text>
          </View>

          <View style={styles.card}>
            {!sent ? (
              <>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.sub}>
                  Enter your school email address and we'll send you a reset link.
                </Text>

                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>School Email</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.inputIcon}>✉️</Text>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your@school.edu.in"
                      placeholderTextColor={Colors.text3}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.btn, loading && { opacity: 0.7 }]}
                  onPress={handleSend}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={[Colors.purpleLight, Colors.purple, Colors.purpleDark]}
                    style={styles.btnGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.btnText}>{loading ? 'Sending…' : 'Send Reset Link'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successWrap}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Check your inbox!</Text>
                <Text style={styles.successSub}>
                  We've sent a password reset link to{'\n'}
                  <Text style={{ color: Colors.purple, fontWeight: '700' }}>{email}</Text>
                </Text>
                <TouchableOpacity style={styles.btn} onPress={() => router.replace('/auth/login')} activeOpacity={0.85}>
                  <LinearGradient
                    colors={[Colors.purpleLight, Colors.purple, Colors.purpleDark]}
                    style={styles.btnGrad}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.btnText}>Back to Sign In</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingTop: 60, paddingHorizontal: Spacing.xl, paddingBottom: 32 },
  backBtn: { marginBottom: 24 },
  backText: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  iconWrap: { alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 56 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: Spacing.xl, ...Shadow.md },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text1, marginBottom: 8 },
  sub: { fontSize: 13, color: Colors.text2, lineHeight: 20, marginBottom: 22 },
  fieldWrap: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  inputIcon: { fontSize: 15, marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: Colors.text1, paddingVertical: 12 },
  btn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  btnGrad: { paddingVertical: 16, alignItems: 'center' },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '800' },
  successWrap: { alignItems: 'center', paddingVertical: 10 },
  successIcon: { fontSize: 48, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '800', color: Colors.text1, marginBottom: 10 },
  successSub: { fontSize: 13, color: Colors.text2, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
});
