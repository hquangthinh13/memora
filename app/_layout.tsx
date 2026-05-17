import "../global.css";

import { Stack, useRouter } from "expo-router";
import { useFonts } from "expo-font";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { AppState } from "react-native";

import { fontAssets } from "@/lib/fonts";
import { useAuth } from "@/hooks/useAuth";
import { AuthProvider } from "@/providers/AuthProvider";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import { OverlayProvider } from "@/providers/OverlayProvider";
import { reconcileReminderSchedule } from "@/services/studyReminders";

function AppSideEffects() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void reconcileReminderSchedule(user.id);

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void reconcileReminderSchedule(user.id);
      }
    });

    return () => {
      appStateSub.remove();
    };
  }, [user]);

  useEffect(() => {
    const responseSub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push("/(tabs)");
    });

    return () => {
      responseSub.remove();
    };
  }, [router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  if (fontError) {
    throw fontError;
  }

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <OverlayProvider>
        <NotificationsProvider>
          <AppSideEffects />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </NotificationsProvider>
      </OverlayProvider>
    </AuthProvider>
  );
}
