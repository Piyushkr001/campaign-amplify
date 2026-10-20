import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Palette } from '@/constants/colors';
import { AuthService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setUser = useAuthStore((s) => s.setUser);

  const handleLogin = async (overrideEmail?: string, overridePassword?: string) => {
    const loginEmail = overrideEmail || email;
    const loginPassword = overridePassword || password;

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await AuthService.login({
        email: loginEmail,
        password: loginPassword,
      });
      setUser(result.user);
      router.back();
    } catch (err: any) {
      const code = err?.response?.data?.error?.code;
      if (code === 'INVALID_CREDENTIALS') {
        setErrorMessage('Invalid email or password. Please try again.');
      } else {
        setErrorMessage(err?.response?.data?.error?.message || 'Login failed. Please check your connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role: 'USER' | 'REVIEWER' | 'ADMIN') => {
    if (role === 'USER') {
      setEmail('creator@campaignamplify.org');
      setPassword('Password123!');
      handleLogin('creator@campaignamplify.org', 'Password123!');
    } else if (role === 'REVIEWER') {
      setEmail('reviewer@campaignamplify.org');
      setPassword('Password123!');
      handleLogin('reviewer@campaignamplify.org', 'Password123!');
    } else {
      setEmail('admin@campaignamplify.org');
      setPassword('AdminPassword123!');
      handleLogin('admin@campaignamplify.org', 'AdminPassword123!');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header with Close */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            accessibilityLabel="Close login">
            <Ionicons name="close" size={24} color={Palette.navy900} />
          </TouchableOpacity>
        </View>

        <View style={styles.titleSection}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>
            Sign in to create campaigns, back community causes, and manage your amplification impact.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={Palette.error600} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Input Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Palette.neutral400}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={Palette.neutral400}
              secureTextEntry
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
            onPress={() => handleLogin()}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color={Palette.pureWhite} />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Register link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.footerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Demo Logins for Pair Programming / Review Testing */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>DEMO ACCOUNTS (DEVELOPMENT)</Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => handleQuickDemo('USER')}
              disabled={isLoading}>
              <Text style={styles.demoChipText}>User / Backer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoChip, styles.demoChipReviewer]}
              onPress={() => handleQuickDemo('REVIEWER')}
              disabled={isLoading}>
              <Text style={styles.demoChipReviewerText}>Reviewer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.demoChip, styles.demoChipAdmin]}
              onPress={() => handleQuickDemo('ADMIN')}
              disabled={isLoading}>
              <Text style={styles.demoChipAdminText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.warmWhite,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Palette.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Palette.navy950,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Palette.neutral500,
    lineHeight: 22,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.error50,
    borderWidth: 1,
    borderColor: Palette.error200,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: Palette.error700,
    fontSize: 13,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.navy800,
  },
  input: {
    backgroundColor: Palette.pureWhite,
    borderWidth: 1,
    borderColor: Palette.neutral200,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Palette.navy950,
  },
  primaryButton: {
    backgroundColor: Palette.primary600,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: Palette.pureWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: Palette.neutral500,
  },
  footerLink: {
    fontSize: 14,
    color: Palette.primary600,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Palette.neutral200,
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.neutral400,
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  demoChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Palette.neutral100,
    borderWidth: 1,
    borderColor: Palette.neutral200,
  },
  demoChipText: {
    fontSize: 12,
    color: Palette.navy800,
    fontWeight: '500',
  },
  demoChipReviewer: {
    backgroundColor: Palette.purple50,
    borderColor: Palette.purple200,
  },
  demoChipReviewerText: {
    fontSize: 12,
    color: Palette.purple700,
    fontWeight: '600',
  },
  demoChipAdmin: {
    backgroundColor: Palette.amber50,
    borderColor: Palette.amber200,
  },
  demoChipAdminText: {
    fontSize: 12,
    color: Palette.amber800,
    fontWeight: '600',
  },
});
