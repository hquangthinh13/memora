import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  AvatarPicker,
  NavLink,
  Screen,
  SectionHeader,
} from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/errors";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import { updateProfile, type ProfileUpdates } from "@/services/profiles";

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [selectedAvatarUri, setSelectedAvatarUri] = useState<string | null>(
    null,
  );
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync form fields if profile loads after mount (e.g. on first render).
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setSelectedAvatarUri(null);
    setAvatarRemoved(false);
  }, [profile?.id]);

  // The URI shown in the picker: prefer newly picked local file, then fall
  // back to the saved remote URL (unless the user explicitly removed it).
  const previewUri =
    selectedAvatarUri ?? (avatarRemoved ? null : (profile?.avatar_url ?? null));

  async function handleSave() {
    if (!user) return;

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Display name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Upload new avatar if the user picked one.
      let nextAvatarUrl: string | null | undefined = undefined;

      if (selectedAvatarUri) {
        const uploaded = await uploadImageToCloudinary({
          localUri: selectedAvatarUri,
          folder: "memora/user",
        });
        nextAvatarUrl = uploaded.secureUrl;
      } else if (avatarRemoved) {
        // Explicitly clear — pass null so the column is set to NULL in DB.
        nextAvatarUrl = null;
      }
      // undefined means "no change to avatar_url" — omit the field entirely.

      const updates: ProfileUpdates = {
        display_name: trimmedName,
        ...(nextAvatarUrl !== undefined ? { avatar_url: nextAvatarUrl } : {}),
      };

      // 2. Persist to the users table.
      await updateProfile(user.id, updates);

      // 3. Re-fetch so the AuthContext (and every consumer) sees fresh data.
      await refreshProfile();

      router.back();
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not save profile."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      scroll
      header={
        <SectionHeader
          variant="detail"
          title="Edit profile"
          backHref="/profile"
        />
      }
    >
      {/* Avatar picker — centred above the form card */}
      <AvatarPicker
        imageUri={previewUri}
        initials={profile?.display_name ?? user?.email ?? "?"}
        disabled={submitting}
        onChange={(uri) => {
          setSelectedAvatarUri(uri);
          setAvatarRemoved(false);
          setError(null);
        }}
        onRemove={() => {
          setSelectedAvatarUri(null);
          setAvatarRemoved(true);
        }}
        onError={setError}
      />

      {/* Form fields */}
      <AppCard className="gap-4">
        <AppInput
          label="Display name"
          placeholder="Your name"
          value={displayName}
          onChangeText={(text) => {
            setDisplayName(text);
            setError(null);
          }}
          autoCapitalize="words"
          autoCorrect={false}
          editable={!submitting}
          returnKeyType="done"
        />

        <AppInput
          label="Email"
          value={profile?.email ?? ""}
          editable={false}
          inputClassName="opacity-50"
        />

        {error ? (
          <AppText variant="caption" className="text-danger">
            {error}
          </AppText>
        ) : null}

        <AppButton
          title={submitting ? "Saving changes..." : "Save changes"}
          variant="primary"
          disabled={submitting}
          onPress={handleSave}
        />
      </AppCard>

      {/* Security */}
      <AppCard className="gap-3">
        <AppText variant="subtitle">Security</AppText>
        <AppText variant="body" className="text-text-muted">
          Change your password using email verification.
        </AppText>
        <NavLink
          href="/profile/change-password"
          title="Change password"
          variant="secondary"
        />
      </AppCard>
    </Screen>
  );
}
