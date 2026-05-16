import * as Linking from "expo-linking";
import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import { AppText, Screen } from "@/components";
import { completeOAuthSessionFromUrl, getOAuthRedirectTo } from "@/services/auth";

export default function AuthCallbackScreen() {
  const incomingUrl = Linking.useURL();
  const params = useLocalSearchParams<Record<string, string | string[]>>();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = useMemo(() => {
    if (incomingUrl) {
      return incomingUrl;
    }

    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === "string") {
        searchParams.set(key, value);
      }
    });

    const query = searchParams.toString();

    return `${getOAuthRedirectTo()}${query ? `?${query}` : ""}`;
  }, [incomingUrl, params]);

  useEffect(() => {
    let mounted = true;

    completeOAuthSessionFromUrl(callbackUrl)
      .then(() => {
        if (mounted) {
          setDone(true);
        }
      })
      .catch((sessionError: unknown) => {
        if (mounted) {
          setError(
            sessionError instanceof Error
              ? sessionError.message
              : "Could not finish sign in.",
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [callbackUrl]);

  if (done) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Screen contentClassName="justify-center">
      <AppText variant="title">Signing you in</AppText>
      <AppText className="text-text-muted">
        {error ?? "Finishing the sign-in flow..."}
      </AppText>
    </Screen>
  );
}
