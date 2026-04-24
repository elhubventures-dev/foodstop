import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { supabase } from '@/lib/supabase';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else {
      Alert.alert('Success', 'Account created! Check your email to verify if required, or simply login.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoPlaceholder}>
           <IconSymbol size={48} name="takeoutbag.and.cup.and.straw.fill" color="white" />
        </View>
        <ThemedText type="title" style={styles.title}>Food Stop</ThemedText>
        <ThemedText style={styles.subtitle}>Sign in or create an account</ThemedText>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Email Address</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>Password</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={handleSignUp}
          disabled={loading}
        >
          <ThemedText style={styles.secondaryButtonText}>Create Account</ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.forgotPassword}>
           <ThemedText style={styles.forgotPasswordText}>Continue as Guest</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: Theme.colors.primary,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.colors.textSecondary,
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.radius.md,
    padding: 16,
    fontSize: 16,
    color: Theme.colors.text,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    padding: 16,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.primary,
    padding: 16,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotPasswordText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    textDecorationLine: 'underline',
  }
});
