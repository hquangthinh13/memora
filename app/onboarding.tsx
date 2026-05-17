import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";
import { View } from "react-native";

import { AppText, NavLink, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import Images from "@/constants/images";

export default function OnboardingScreen() {
  const { loading, session } = useAuth();

  if (loading) return null;
  if (session) return <Redirect href="/(tabs)" />;

  return (
    <Screen scroll contentClassName="justify-center gap-10">
      <StatusBar style="dark" />

      {/* Illustration */}
      <View className="items-center">
        <View className="h-64 w-64 items-center justify-center rounded-lg bg-mint-soft">
          <Image
            source={Images.floral01}
            style={{ width: 210, height: 210 }}
            contentFit="contain"
          />
        </View>
      </View>

      {/* Brand */}
      <View className="gap-3">
        <AppText variant="title" className="text-center text-5xl">
          Memora
        </AppText>
        <AppText variant="body" className="text-center text-text-muted">
          Friendly flashcards, study rooms, and playful progress for language
          learners.
        </AppText>
      </View>

      {/* CTAs */}
      <View className="gap-3">
        <NavLink href="/login" title="Log in" variant="primary" />
        <NavLink href="/register" title="Create account" variant="secondary" />
      </View>
    </Screen>
  );
}

