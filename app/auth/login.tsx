import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors, Radius, Spacing, Shadow } from '@/constants/theme';

const DEMO_USERNAME = 'as@gmail.com';
const DEMO_PASSWORD = '1234';

export default function LoginScreen() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [error, setError] = useState('');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -7, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError('');
    if (!username.trim()) { setError('Please enter your email or username.'); shake(); return; }
    if (!password.trim()) { setError('Please enter your password.'); shake(); return; }

    setLoading(true);
    const result = await login(username.trim(), password);
    setLoading(false);

    if (result.success) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start(() => {
        router.replace('/tabs');
      });
    } else {
      setError(result.error || 'Login failed. Please try again.');
      shake();
    }
  };

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#c9a8f5', '#8b4ee0', '#6722d5', '#3a0f80']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />
      <View style={styles.decorTop} />
      <View style={styles.decorMid} />
      <View style={styles.decorBot} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Branding */}
          <View style={styles.brandArea}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🎓</Text>
            </View>
            <Text style={styles.appName}>TeachDesk</Text>
            <Text style={styles.appTagline}>Your school, simplified.</Text>
          </View>

          {/* Card */}
          <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your teacher account</Text>

            {/* Username */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email / Username</Text>
              <View style={[styles.inputWrap, userFocused && styles.inputFocused]}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="e.g. teacher@school.in"
                  placeholderTextColor={Colors.text3}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onFocus={() => setUserFocused(true)}
                  onBlur={() => setUserFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={[styles.inputWrap, passFocused && styles.inputFocused]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={Colors.text3}
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot */}
            <TouchableOpacity style={styles.forgotWrap} onPress={() => router.push('/auth/forgot-password')} activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.75 }]}
              onPress={handleLogin}
              activeOpacity={0.88}
              disabled={loading}
            >
              <LinearGradient
                colors={loading ? ['#a07ed0', '#a07ed0'] : [Colors.purpleLight, Colors.purple, Colors.purpleDark]}
                style={styles.loginBtnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.loginBtnText}>Signing in…</Text>
                  </View>
                ) : (
                  <Text style={styles.loginBtnText}>Sign In  →</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>test account</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Demo Card */}
            <TouchableOpacity style={styles.demoCard} onPress={() => { setUsername(DEMO_USERNAME); setPassword(DEMO_PASSWORD); setError(''); }} activeOpacity={0.8}>
              <Text style={styles.demoHeaderText}>🧪 Demo Credentials</Text>
              <View style={styles.demoRow}>
                <Text style={styles.demoLabel}>Username</Text>
                <Text style={styles.demoVal} numberOfLines={1}>{DEMO_USERNAME}</Text>
              </View>
              <View style={[styles.demoRow, { marginTop: 5 }]}>
                <Text style={styles.demoLabel}>Password</Text>
                <Text style={styles.demoVal}>{DEMO_PASSWORD}</Text>
              </View>
              <Text style={styles.demoHint}>Tap to autofill →</Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.footer}>© 2026 TeachDesk · EduMug Platform</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingTop: 56, paddingBottom: 32, paddingHorizontal: Spacing.xl },
  decorTop: { position: 'absolute', top: -80, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.08)' },
  decorMid: { position: 'absolute', top: 200, left: -80, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  decorBot: { position: 'absolute', bottom: -60, right: 40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' },
  brandArea: { alignItems: 'center', marginBottom: 28 },
  logoCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.white, letterSpacing: -0.5 },
  appTagline: { fontSize: 14, color: 'rgba(255,255,255,0.65)', marginTop: 4 },
  card: { backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: Spacing.xl, ...Shadow.md },
  cardTitle: { fontSize: 22, fontWeight: '800', color: Colors.text1, marginBottom: 4 },
  cardSub: { fontSize: 13, color: Colors.text2, marginBottom: 22 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md, paddingVertical: 2 },
  inputFocused: { borderColor: Colors.purple, backgroundColor: Colors.purplePale },
  inputIcon: { fontSize: 15, marginRight: 8 },
  input: { flex: 1, fontSize: 14, color: Colors.text1, paddingVertical: 12 },
  eyeIcon: { fontSize: 16, paddingLeft: 6 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotText: { fontSize: 12, fontWeight: '600', color: Colors.purple },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: Colors.redBg, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 14, borderWidth: 1, borderColor: '#fcc' },
  errorIcon: { fontSize: 13, marginTop: 1 },
  errorText: { flex: 1, fontSize: 12, color: Colors.redText, fontWeight: '500', lineHeight: 18 },
  loginBtn: { borderRadius: Radius.lg, overflow: 'hidden', ...Shadow.sm },
  loginBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginBtnText: { color: Colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 11, color: Colors.text3, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  demoCard: { backgroundColor: Colors.purplePale, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.purpleBg, borderStyle: 'dashed' },
  demoHeaderText: { fontSize: 11, fontWeight: '700', color: Colors.purple, marginBottom: 8 },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  demoLabel: { fontSize: 10, fontWeight: '700', color: Colors.text3, textTransform: 'uppercase', width: 66 },
  demoVal: { fontSize: 12, color: Colors.purple, fontWeight: '600', flex: 1 },
  demoHint: { fontSize: 11, color: Colors.purpleLight, fontWeight: '600', textAlign: 'right', marginTop: 8 },
  footer: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 24 },
});
