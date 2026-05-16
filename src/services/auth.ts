import { makeRedirectUri } from "expo-auth-session";
import Constants, { AppOwnership, ExecutionEnvironment } from "expo-constants";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "@/lib/supabase";
import { upsertProfileForUser } from "./profiles";

WebBrowser.maybeCompleteAuthSession();

const OAUTH_REDIRECT_PATH = "auth/callback";
const NATIVE_OAUTH_REDIRECT_TO = "memora://auth/callback";

export type EmailCredentials = {
  email: string;
  password: string;
};

export type OtpSignUpCredentials = {
  email: string;
  name?: string;
};

export async function sendEmailOtpSignUp({
  email,
  name,
}: OtpSignUpCredentials) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      data: {
        account_setup_completed: false,
        full_name: name,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    throw error;
  }

  if (data.user && !needsPasswordSetup(data.user)) {
    await supabase.auth.signOut();
    throw new Error("An account already exists for this email. Log in instead.");
  }

  if (data.user) {
    await upsertProfileForUser(data.user);
  }

  return data;
}

// ─── Password change via recovery OTP ────────────────────────────────────────

/**
 * Sends a 6-digit recovery code to the user's email.
 * Supabase uses the "Password Recovery" email template for this.
 * The template must contain {{ .Token }} to show the 6-digit code.
 */
export async function sendPasswordRecoveryOtp(email: string) {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    // redirectTo is required by Supabase even in OTP-code mode.
    // Must be registered in Dashboard → Auth → URL Configuration.
    redirectTo: NATIVE_OAUTH_REDIRECT_TO,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Verifies the 6-digit recovery OTP and establishes a Supabase recovery
 * session. Must be followed by changePassword() while the session is active.
 */
export async function verifyPasswordRecoveryOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Updates the authenticated user's password. Call this after
 * verifyPasswordRecoveryOtp() has established a recovery session.
 * Unlike setPasswordForCurrentUser, this does NOT touch user metadata.
 */
export async function changePassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────────────────────

export async function resendSignupOtp(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function setPasswordForCurrentUser(password: string) {
  const { data, error } = await supabase.auth.updateUser({
    password,
    data: {
      account_setup_completed: true,
    },
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    await upsertProfileForUser(data.user);
  }

  return data;
}

export function needsPasswordSetup(user: { user_metadata?: Record<string, unknown> } | null) {
  return user?.user_metadata?.account_setup_completed === false;
}

export function getAuthErrorMessage(caught: unknown, fallback: string) {
  const message = caught instanceof Error
    ? caught.message
    : caught &&
        typeof caught === "object" &&
        "message" in caught &&
        typeof caught.message === "string"
      ? caught.message
      : null;

  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("token") && normalized.includes("expired")) {
    return "This code has expired. Request a new code and try again.";
  }

  if (normalized.includes("invalid") && normalized.includes("token")) {
    return "That code is not valid. Check the 6 digits and try again.";
  }

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "An account already exists for this email. Log in instead.";
  }

  if (normalized.includes("password") && normalized.includes("weak")) {
    return "This password is too weak. Use a longer, less common password.";
  }

  if (normalized.includes("password") && normalized.includes("characters")) {
    return "Password must be at least 8 characters.";
  }

  if (normalized.includes("same password") || normalized.includes("different password")) {
    return "New password must be different from your current password.";
  }

  return message;
}

export async function signInWithEmail({ email, password }: EmailCredentials) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    await upsertProfileForUser(data.user);
  }

  return data;
}

export async function signInWithGoogle() {
  const redirectTo = getOAuthRedirectTo();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      // Supabase Dashboard must allow memora://** in
      // Authentication > URL Configuration > Redirect URLs.
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    throw error;
  }

  if (!data.url) {
    throw new Error("Google OAuth did not return a redirect URL.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    return null;
  }

  return completeOAuthSessionFromUrl(result.url);
}

export function getOAuthRedirectTo() {
  // Expo Go cannot receive memora:// links because that scheme is registered
  // only in development/production builds. In Expo Go, use the exp:// return
  // URL from makeRedirectUri. Supabase Redirect URLs must include both:
  // memora://** for builds, and the Expo Go exp:// callback used in dev.
  if (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === AppOwnership.Expo
  ) {
    return makeRedirectUri({
      path: OAUTH_REDIRECT_PATH,
    });
  }

  makeRedirectUri({
    native: NATIVE_OAUTH_REDIRECT_TO,
    scheme: "memora",
    path: OAUTH_REDIRECT_PATH,
  });

  // Web/dev can resolve makeRedirectUri to localhost. This app's native Google
  // OAuth flow should return through the app scheme instead, never localhost.
  return NATIVE_OAUTH_REDIRECT_TO;
}

export async function completeOAuthSessionFromUrl(callbackUrl: string) {
  const query = callbackUrl.split("?")[1]?.split("#")[0] ?? "";
  const fragment = callbackUrl.split("#")[1] ?? "";
  const params = new URLSearchParams(fragment || query);
  const code = params.get("code");
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  if (code) {
    const { data: sessionData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      throw exchangeError;
    }

    if (sessionData.user) {
      await upsertProfileForUser(sessionData.user);
    }

    return sessionData;
  }

  if (accessToken && refreshToken) {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

    if (sessionError) {
      throw sessionError;
    }

    if (sessionData.user) {
      await upsertProfileForUser(sessionData.user);
    }

    return sessionData;
  }

  throw new Error("Auth callback did not include a session.");
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
