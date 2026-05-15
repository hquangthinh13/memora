import { Redirect, useRouter } from "expo-router";
import { useState } from "react";

import { AppButton, AppCard, AppInput, AppText, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import {
  getAuthErrorMessage,
  needsPasswordSetup,
  setPasswordForCurrentUser,
} from "@/services/auth";

const MIN_PASSWORD_LENGTH = 8;

export default function SetupPasswordScreen() {
  const router = useRouter();
  const { loading, session, user, refreshProfile } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (!session) return <Redirect href="/login" />;
  if (!needsPasswordSetup(user)) return <Redirect href="/(tabs)" />;

  async function handleSubmit() {
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setSubmitting(true);

    try {
      await setPasswordForCurrentUser(password);
      await refreshProfile();
      router.replace("/(tabs)");
    } catch (caught) {
      setError(getAuthErrorMessage(caught, "Could not save your password."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="title">Set your password</AppText>
      <AppText variant="body" className="text-text-muted">
        Add a password so you can log in with email later.
      </AppText>

      <AppCard className="gap-4">
        <AppInput
          label="Password"
          placeholder="At least 8 characters"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <AppInput
          label="Confirm password"
          placeholder="Repeat password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {error ? (
          <AppText variant="caption" className="text-danger">
            {error}
          </AppText>
        ) : null}
        <AppButton
          title={submitting ? "Saving..." : "Complete setup"}
          variant="primary"
          disabled={submitting}
          onPress={handleSubmit}
        />
      </AppCard>
    </Screen>
  );
}
