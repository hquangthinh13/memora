import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  Screen,
  SectionHeader,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import {
  changePassword,
  getAuthErrorMessage,
  sendPasswordRecoveryOtp,
  verifyPasswordRecoveryOtp,
} from "@/services/auth";

// Minimum password length — must match setup-password.tsx.
const MIN_PASSWORD_LENGTH = 8;

type Step = "request" | "verify" | "success";

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  // Prevent setState calls after the screen unmounts (e.g. during navigation).
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const email = profile?.email ?? "";

  // ── step ────────────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("request");

  // ── step: request ────────────────────────────────────────────────────────────
  const [sending, setSending] = useState(false);

  // ── step: verify ─────────────────────────────────────────────────────────────
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // ── shared ───────────────────────────────────────────────────────────────────
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for "resend" button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // ── handlers ─────────────────────────────────────────────────────────────────

  async function handleSendCode() {
    setError(null);
    setMessage(null);
    setSending(true);

    try {
      await sendPasswordRecoveryOtp(email);
      if (mountedRef.current) {
        setCooldown(45);
        setStep("verify");
      }
    } catch (caught) {
      if (mountedRef.current) {
        setError(getAuthErrorMessage(caught, "Could not send the verification code."));
      }
    } finally {
      if (mountedRef.current) setSending(false);
    }
  }

  async function handleResend() {
    setError(null);
    setMessage(null);
    setResending(true);

    try {
      await sendPasswordRecoveryOtp(email);
      if (mountedRef.current) {
        setCooldown(45);
        setMessage("A new code was sent to your email.");
      }
    } catch (caught) {
      if (mountedRef.current) {
        setError(getAuthErrorMessage(caught, "Could not resend the code."));
      }
    } finally {
      if (mountedRef.current) setResending(false);
    }
  }

  async function handleSavePassword() {
    setError(null);
    setMessage(null);

    if (token.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Verify the recovery OTP — Supabase establishes a recovery session.
      await verifyPasswordRecoveryOtp(email, token);

      // 2. Update the password while the recovery session is active.
      await changePassword(newPassword);

      // AuthProvider's onAuthStateChange fires USER_UPDATED automatically and
      // re-syncs the profile. Calling refreshProfile() here would race against
      // that listener (both query auth state at the same time), which can cause
      // the request to hang on React Native. We skip it intentionally.

      if (mountedRef.current) setStep("success");
    } catch (caught) {
      if (mountedRef.current) {
        setError(getAuthErrorMessage(caught, "Could not update your password."));
      }
    } finally {
      if (mountedRef.current) setSubmitting(false);
    }
  }

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <Screen
      scroll
      header={
        <SectionHeader variant="detail" title="Change password" />
      }
    >
      {/* ── Step 1: Request code ─────────────────────────────────────────── */}
      {step === "request" ? (
        <>
          <AppText variant="title">Verify your email</AppText>
          <AppText variant="body" className="text-text-muted">
            We will send a 6-digit verification code to your email address. Enter
            the code along with your new password to complete the change.
          </AppText>

          <AppCard className="gap-4">
            <AppInput
              label="Email"
              value={email}
              editable={false}
              inputClassName="opacity-50"
            />

            {error ? (
              <AppText variant="caption" className="text-danger">
                {error}
              </AppText>
            ) : null}

            <AppButton
              title={sending ? "Sending..." : "Send verification code"}
              variant="primary"
              disabled={sending || !email}
              onPress={handleSendCode}
            />
          </AppCard>
        </>
      ) : null}

      {/* ── Step 2: Enter code + new password ───────────────────────────── */}
      {step === "verify" ? (
        <>
          <AppText variant="title">Set new password</AppText>
          <AppText variant="body" className="text-text-muted">
            Enter the 6-digit code sent to{" "}
            <AppText variant="body" className="font-sans-semibold">
              {email}
            </AppText>
            , then choose a new password.
          </AppText>

          <AppCard className="gap-4">
            <AppInput
              label="Verification code"
              placeholder="123456"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              value={token}
              onChangeText={(v) => {
                setToken(v.replace(/\D/g, "").slice(0, 6));
                setError(null);
              }}
            />

            <AppInput
              label="New password"
              placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
              secureTextEntry
              textContentType="newPassword"
              value={newPassword}
              onChangeText={(v) => {
                setNewPassword(v);
                setError(null);
              }}
            />

            <AppInput
              label="Confirm new password"
              placeholder="Repeat password"
              secureTextEntry
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setError(null);
              }}
            />

            {message ? (
              <AppText variant="caption" className="text-success">
                {message}
              </AppText>
            ) : null}
            {error ? (
              <AppText variant="caption" className="text-danger">
                {error}
              </AppText>
            ) : null}

            <AppButton
              title={submitting ? "Saving..." : "Save new password"}
              variant="primary"
              disabled={submitting || resending}
              onPress={handleSavePassword}
            />

            <AppButton
              title={
                resending
                  ? "Sending..."
                  : cooldown > 0
                    ? `Resend code in ${cooldown}s`
                    : "Resend code"
              }
              variant="secondary"
              disabled={submitting || resending || cooldown > 0}
              onPress={handleResend}
            />
          </AppCard>
        </>
      ) : null}

      {/* ── Step 3: Success ──────────────────────────────────────────────── */}
      {step === "success" ? (
        <>
          <AppText variant="title">Password updated</AppText>
          <AppText variant="body" className="text-text-muted">
            Your password has been changed successfully. Use it the next time you
            log in.
          </AppText>

          <AppCard className="gap-4 bg-mint-soft">
            <View className="gap-1">
              <AppText variant="subtitle">All done</AppText>
              <AppText variant="body" className="text-text-muted">
                You are still logged in. No further action is needed.
              </AppText>
            </View>

            <AppButton
              title="Back to profile"
              variant="primary"
              onPress={() => router.back()}
            />
          </AppCard>
        </>
      ) : null}
    </Screen>
  );
}
