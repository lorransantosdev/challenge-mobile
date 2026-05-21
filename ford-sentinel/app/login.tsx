import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { impact, selection, ImpactStyle } from '../utils/haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { colors, radii, spacing } from '../utils/theme';
import { login } from '../services/auth';
import { auditLog } from '../services/security';

function BlueprintBg() {
  const lines = [];
  const step = 32;
  for (let i = 0; i < 30; i++) {
    lines.push(
      <Line
        key={`v${i}`}
        x1={i * step}
        y1={0}
        x2={i * step}
        y2={2000}
        stroke={colors.border}
        strokeOpacity={0.18}
        strokeWidth={0.5}
      />
    );
    lines.push(
      <Line
        key={`h${i}`}
        x1={0}
        y1={i * step}
        x2={2000}
        y2={i * step}
        stroke={colors.border}
        strokeOpacity={0.18}
        strokeWidth={0.5}
      />
    );
  }
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      {lines}
    </Svg>
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('joao@ford.com');
  const [password, setPassword] = useState('sentinel123');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwdFocus, setPwdFocus] = useState(false);
  const scale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function handleLogin() {
    if (loading) return;
    setLoading(true);
    impact(ImpactStyle.Medium);
    try {
      await login(email, password);
      router.replace('/(app)');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Credenciais inválidas';
      Alert.alert('Acesso negado', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleBiometric() {
    selection();
    try {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) {
        Alert.alert('Biometria', 'Biometria não disponível neste dispositivo.');
        return;
      }
      const res = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Entrar no Ford Sentinel',
        fallbackLabel: 'Usar senha',
      });
      if (res.success) {
        auditLog.log({ action: 'biometric_login', result: 'success' });
        await login('joao@ford.com', 'sentinel123');
        router.replace('/(app)');
      } else {
        auditLog.log({ action: 'biometric_login', result: 'failure' });
      }
    } catch {
      Alert.alert('Biometria', 'Não foi possível autenticar.');
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <BlueprintBg />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kav}
      >
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <Ionicons name="car-sport-outline" size={48} color={colors.cyan} />
          </View>
          <Text style={styles.brand}>FORD SENTINEL</Text>
          <Text style={styles.sub}>Vehicle Intelligence System</Text>

          <View style={styles.form}>
            <View style={[styles.inputWrap, emailFocus && styles.inputFocus]}>
              <Ionicons name="mail-outline" size={18} color={colors.text2} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocus(true)}
                onBlur={() => setEmailFocus(false)}
                placeholder="Email"
                placeholderTextColor={colors.text2}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
                maxLength={254}
              />
            </View>

            <View style={[styles.inputWrap, pwdFocus && styles.inputFocus]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.text2} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPwdFocus(true)}
                onBlur={() => setPwdFocus(false)}
                placeholder="Senha"
                placeholderTextColor={colors.text2}
                secureTextEntry={!showPwd}
                style={styles.input}
                maxLength={128}
              />
              <Pressable onPress={() => setShowPwd((s) => !s)} hitSlop={10}>
                <Ionicons
                  name={showPwd ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.text2}
                />
              </Pressable>
            </View>

            <Animated.View style={btnStyle}>
              <Pressable
                onPressIn={() => {
                  scale.value = withTiming(0.97, { duration: 80 });
                }}
                onPressOut={() => {
                  scale.value = withTiming(1, { duration: 120 });
                }}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={[colors.cyan, '#0066FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>INICIALIZAR</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            <Pressable onPress={handleBiometric} style={styles.bio} hitSlop={8}>
              <Ionicons name="finger-print-outline" size={22} color={colors.text2} />
              <Text style={styles.bioText}>Biometria</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>v1.0 · FIAP × Ford Challenge 2026</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  kav: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.cyanGlow,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  brand: {
    color: colors.text1,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 6,
  },
  sub: {
    color: colors.text2,
    fontSize: 12,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },
  form: {
    width: '100%',
    marginTop: 40,
    gap: spacing.md,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 14 : 6,
    gap: spacing.sm,
  },
  inputFocus: {
    borderColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  input: {
    flex: 1,
    color: colors.text1,
    fontSize: 15,
  },
  cta: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    borderRadius: radii.md,
    marginTop: spacing.sm,
  },
  ctaText: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 2,
    fontSize: 14,
  },
  bio: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  bioText: {
    color: colors.text2,
    fontSize: 13,
    letterSpacing: 1,
  },
  footer: {
    color: colors.text2,
    fontSize: 11,
    textAlign: 'center',
    paddingBottom: spacing.lg,
    letterSpacing: 1,
  },
});
