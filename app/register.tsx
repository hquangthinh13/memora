import { Redirect, useRouter } from "expo-router";
import { useState } from "react";

import { AppButton, AppCard, AppInput, AppText, NavLink, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import {
  getAuthErrorMessage,
  sendEmailOtpSignUp,
} from "@/services/auth";

export default function RegisterScreen() {
  const router = useRouter();
  const { loading, session } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return null;
  if (session) return <Redirect href="/(tabs)" />;

  async function handleEmailSignUp() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await sendEmailOtpSignUp({ name, email: normalizedEmail });

      router.replace({
        pathname: "/verify-otp",
        params: {
          email: normalizedEmail,
        },
      });
    } catch (caught) {
      setError(getAuthErrorMessage(caught, "Could not send the code."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="title">Create account</AppText>
      <AppText variant="body" className="text-text-muted">
        Enter your email and we will send a 6-digit code.
      </AppText>

      <AppCard className="gap-4">
        <AppInput label="Name" placeholder="Alex" value={name} onChangeText={setName} />
        <AppInput
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}
        <AppButton
          title={submitting ? "Sending..." : "Send code"}
          variant="primary"
          disabled={submitting}
          onPress={handleEmailSignUp}
        />
        {/* OAuth is temporarily disabled while email OTP is the primary flow. */}
        <NavLink href="/login" title="I already have an account" variant="ghost" />
      </AppCard>
    </Screen>
  );
}
