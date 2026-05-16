import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image } from "expo-image";
import { View } from "react-native";

import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  NavLink,
  Screen,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import {
  getAuthErrorMessage,
  resendSignupOtp,
  verifyEmailOtp,
} from "@/services/auth";
import Images from "@/constants/images";

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();
  const { loading } = useAuth();
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(45);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const email = useMemo(
    () => emailParam?.trim().toLowerCase() ?? "",
    [emailParam],
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (loading) return null;
  if (!email) return <Redirect href="/register" />;

  async function handleVerify() {
    if (!email) {
      setError("Enter your email again to request a new code.");
      return;
    }
    if (token.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await verifyEmailOtp(email, token);
      router.replace("/setup-password");
    } catch (caught) {
      setError(getAuthErrorMessage(caught, "Could not verify this code."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError("Go back and enter your email again.");
      return;
    }

    setResending(true);
    setError(null);
    setMessage(null);

    try {
      await resendSignupOtp(email);
      setCooldown(45);
      setMessage("A new code was sent to your email.");
    } catch (caught) {
      setError(getAuthErrorMessage(caught, "Could not resend the code."));
    } finally {
      setResending(false);
    }
  }

  return (
    <Screen scroll>
      {/* Illustration */}
      <View className="items-center py-2">
        <View className="h-44 w-44 items-center justify-center rounded-3xl bg-peach-soft">
          <Image
            source={Images.floral01}
            style={{ width: 130, height: 130 }}
            contentFit="contain"
          />
        </View>
      </View>

      {/* Heading */}
      <View className="gap-2">
        <AppText variant="title">Check your email</AppText>
        <AppText variant="body" className="text-text-muted">
          We sent a 6-digit code to{" "}
          <AppText variant="body" className="font-sans-semibold text-text">
            {email}
          </AppText>
          . Enter it below to continue.
        </AppText>
      </View>

      {/* Form */}
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
          onChangeText={(value) =>
            setToken(value.replace(/\D/g, "").slice(0, 6))
          }
          inputClassName="text-center text-2xl font-sans-semibold"
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
          title={submitting ? "Checking…" : "Verify code"}
          variant="primary"
          disabled={submitting || resending}
          onPress={handleVerify}
        />
        <AppButton
          title={
            resending
              ? "Sending…"
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Send a new code"
          }
          variant="secondary"
          disabled={submitting || resending || cooldown > 0}
          onPress={handleResend}
        />
      </AppCard>

      {/* Footer */}
      <NavLink href="/register" title="Use a different email" variant="ghost" />
    </Screen>
  );
}
