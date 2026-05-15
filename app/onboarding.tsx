import { StatusBar } from "expo-status-bar";
import { Redirect } from "expo-router";

import { AppCard, AppText, NavLink, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";

export default function OnboardingScreen() {
  const { loading, session } = useAuth();

  if (loading) {
    return null;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Screen scroll contentClassName="justify-center">
      <AppCard className="bg-mint">
        <AppText variant="title">Memora</AppText>
        <AppText variant="body" className="mt-3 text-text-muted">
          Friendly flashcards, study rooms, and playful progress for language learners.
        </AppText>
      </AppCard>

      <NavLink href="/login" title="Log in" variant="primary" />
      <NavLink href="/register" title="Create account" />
      <StatusBar style="dark" />
    </Screen>
  );
}
