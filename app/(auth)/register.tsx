import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { Image } from "expo-image";
import { View } from "react-native";
import { Link } from "expo-router";
import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  NavLink,
  Screen,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { getAuthErrorMessage, sendEmailOtpSignUp } from "@/services/auth";
import Images from "@/constants/images";

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
        params: { email: normalizedEmail },
      });
    } catch (caught) {
      setError(getAuthErrorMessage(caught, "Could not send the code."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll contentClassName="flex-grow items-center justify-center">
      {/* Illustration */}
      <View className="items-center py-2">
        <View className="h-44 w-44 items-center justify-center">
          <Image
            source={Images.floral04}
            style={{ width: 130, height: 130 }}
            contentFit="contain"
          />
        </View>
      </View>

      {/* Heading */}
      <View className="gap-2 justify-center w-full">
        <AppText variant="title" className="w-full text-center">
          Create an account
        </AppText>
        <AppText variant="body" className="text-text-muted w-full text-center">
          Enter your email and we'll send a 6-digit code to get started.
        </AppText>
      </View>

      {/* Form */}
      <AppCard className="gap-4 w-full">
        <AppInput
          label="Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
        />
        <AppInput
          label="Email"
          placeholder="you@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {error ? (
          <AppText variant="caption" className="text-danger">
            {error}
          </AppText>
        ) : null}
        <AppButton
          title={submitting ? "Sending…" : "Send code"}
          variant="primary"
          disabled={submitting}
          onPress={handleEmailSignUp}
          className="mt-4"
        />
      </AppCard>

      {/* Footer */}
      <View className="flex-row items-center w-full justify-center">
        <AppText variant="body" className="text-text-muted">
          Already have an account?{" "}
        </AppText>
        <Link
          href="/login"
          className="font-sans text-base leading-6 text-text active:text-pink"
        >
          Log in
        </Link>
      </View>
    </Screen>
  );
}
