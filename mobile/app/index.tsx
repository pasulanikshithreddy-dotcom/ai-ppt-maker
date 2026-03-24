import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Screen } from "@/components/ui/screen";
import { StatusBanner } from "@/components/ui/status-banner";
import { theme } from "@/lib/theme";
import { useApp } from "@/providers/app-provider";

export default function AuthScreen() {
  const { authStatus, signInWithPassword, signUpWithPassword, supabaseReady } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === "authenticated") {
      router.replace("/(tabs)/dashboard");
    }
  }, [authStatus]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "login") {
        await signInWithPassword(email, password);
        router.replace("/(tabs)/dashboard");
      } else {
        const result = await signUpWithPassword(email, password, fullName);
        setSuccess(
          result.requiresEmailVerification
            ? "Account created. Verify your email before signing in."
            : "Account created successfully. Redirecting...",
        );
        if (!result.requiresEmailVerification) {
          router.replace("/(tabs)/dashboard");
        }
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scrollable>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>AI PPT Maker</Text>
        <Text style={styles.title}>Build presentation drafts fast from your phone.</Text>
        <Text style={styles.description}>
          Sign in with Supabase to sync plans, history, and generation limits across web and
          mobile.
        </Text>
      </View>

      <View style={styles.switcher}>
        <Button
          title="Login"
          variant={mode === "login" ? "primary" : "ghost"}
          onPress={() => setMode("login")}
          style={styles.switchButton}
        />
        <Button
          title="Sign up"
          variant={mode === "signup" ? "primary" : "ghost"}
          onPress={() => setMode("signup")}
          style={styles.switchButton}
        />
      </View>

      {!supabaseReady ? (
        <StatusBanner
          tone="warning"
          title="Supabase env vars are missing."
          description="Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY before using mobile auth."
        />
      ) : null}
      {error ? <StatusBanner tone="danger" title="Auth failed" description={error} /> : null}
      {success ? <StatusBanner tone="success" title="Auth update" description={success} /> : null}

      {mode === "signup" ? (
        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
      ) : null}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry
      />

      <Button
        title={submitting ? "Working..." : mode === "login" ? "Continue" : "Create account"}
        onPress={() => void handleSubmit()}
        disabled={!supabaseReady || submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 12,
    marginBottom: 24,
  },
  eyebrow: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40,
  },
  description: {
    color: theme.colors.muted,
    fontSize: 15,
    lineHeight: 24,
  },
  switcher: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  switchButton: {
    flex: 1,
  },
});
