import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import type { Inserts, Tables } from "@/types/database";

export type Profile = Tables<"users">;

function getDisplayName(user: User) {
  return (
    user.user_metadata.full_name ??
    user.user_metadata.name ??
    user.email?.split("@")[0] ??
    "Learner"
  );
}

function getPrimaryProvider(user: User): Inserts<"users">["primary_provider"] {
  const provider = String(user.app_metadata.provider ?? "email").toUpperCase();
  const supported = ["EMAIL", "GOOGLE", "FACEBOOK", "GITHUB", "DISCORD", "APPLE", "OTHER"];

  return supported.includes(provider)
    ? (provider as Inserts<"users">["primary_provider"])
    : "OTHER";
}

export async function upsertProfileForUser(user: User) {
  if (!user.email) {
    throw new Error("Authenticated user is missing an email address.");
  }

  const profile: Inserts<"users"> = {
    id: user.id,
    email: user.email,
    display_name: getDisplayName(user),
    avatar_url: user.user_metadata.avatar_url ?? user.user_metadata.picture ?? null,
    primary_provider: getPrimaryProvider(user),
  };

  // Only insert on first login — ignore conflicts so user-edited fields
  // (display_name, avatar_url) are never overwritten by OAuth metadata.
  const { error: upsertError } = await supabase
    .from("users")
    .upsert(profile, { onConflict: "id", ignoreDuplicates: true });

  if (upsertError) {
    throw upsertError;
  }

  // Always re-fetch so callers get the live DB state.
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export type ProfileUpdates = {
  display_name?: string;
  avatar_url?: string | null;
};

export async function updateProfile(userId: string, updates: ProfileUpdates) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCurrentProfile() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const userId = sessionData.session?.user.id;

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
