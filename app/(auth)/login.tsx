import { Redirect, useRouter } from "expo-router";
import { useState } from "react";

import { AppButton, AppCard, AppInput, AppText, NavLink, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import {
  getAuthErrorMessage,
  signInWithEmail,
} from "@/services/auth";

export default function LoginScreen() {
  const router = useRouter();
  const { loading, session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (session) return <Redirect href="/(tabs)" />;

  async function handleEmailLogin() {
    setSubmitting(true);
    setError(null);

    try {
      await signInWithEmail({ email, password });
      router.replace("/(tabs)");
    } catch (caught) {
      setError(getAuthErrorMessage(caught, "Could not log in."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="title">Welcome back</AppText>
      <AppText variant="body" className="text-text-muted">
        Log in to sync decks, study progress, and room play.
      </AppText>

      <AppCard className="gap-4">
        <AppInput
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <AppInput
          label="Password"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
        <AppButton
          title={submitting ? "Logging in..." : "Continue"}
          variant="primary"
          disabled={submitting}
          onPress={handleEmailLogin}
        />
        {/* OAuth is temporarily disabled while email auth is the primary flow. */}
        <NavLink href="/register" title="Create an account" variant="ghost" />
      </AppCard>
    </Screen>
  );
}
