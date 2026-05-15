import "../global.css";

import { Stack } from "expo-router";
import { useFonts } from "expo-font";

import { fontAssets } from "@/lib/fonts";
import { AuthProvider } from "@/providers/AuthProvider";

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
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
