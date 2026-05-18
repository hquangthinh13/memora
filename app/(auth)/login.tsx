import { Link, Redirect, useRouter } from "expo-router";
import { useState } from "react";
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
import { getAuthErrorMessage, signInWithEmail } from "@/services/auth";
import Images from "@/constants/images";

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
    <Screen scroll contentClassName="flex-grow items-center justify-center">
      {/* Illustration */}
      <View className="items-center ">
        <View className="h-44 w-44 items-center justify-center">
          <Image
            source={Images.floral03}
            style={{ width: 130, height: 130 }}
            contentFit="contain"
          />
        </View>
      </View>

      {/* Heading */}
      <View className="gap-2 justify-center w-full">
        <AppText variant="title" className="w-full text-center">
          Welcome back
        </AppText>
        <AppText variant="body" className="text-text-muted w-full text-center">
          Log in to sync your decks and study progress.
        </AppText>
      </View>

      {/* Form */}
      <AppCard className="gap-4 w-full">
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
        {error ? (
          <AppText variant="caption" className="text-danger">
            {error}
          </AppText>
        ) : null}
        <AppButton
          title={submitting ? "Logging in…" : "Continue"}
          variant="primary"
          disabled={submitting}
          onPress={handleEmailLogin}
          className="mt-4"
        />
      </AppCard>

      {/* Footer */}
      <View className="flex-row items-center w-full justify-center">
        <AppText variant="body" className="text-text-muted">
          Don't have an account?{" "}
        </AppText>
        <Link
          href="/register"
          className="font-sans text-base leading-6 text-text active:text-pink"
        >
          Create an account
        </Link>
      </View>
    </Screen>
  );
}
