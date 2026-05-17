import { Image, View } from "react-native";

import { AppText } from "@/components/shared";
import type { CollaboratorPreviewProfile } from "@/services/decks";

type AvatarStackProps = {
  collaborators: CollaboratorPreviewProfile[];
  maxVisible?: number;
};

function initialsFor(profile: CollaboratorPreviewProfile) {
  const name = profile.display_name?.trim() || profile.email?.trim() || "?";
  const parts = name.split(" ").filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AvatarStack({ collaborators, maxVisible = 2 }: AvatarStackProps) {
  if (!collaborators.length) return null;

  const visible = collaborators.slice(0, maxVisible);
  const remaining = collaborators.length - visible.length;

  return (
    <View className="flex-row items-center pl-2">
      {visible.map((collaborator, index) => (
        <View
          key={collaborator.id}
          className={`size-7 overflow-hidden rounded-full border border-surface bg-lavender-soft ${index > 0 ? "-ml-2" : ""}`}
          accessibilityLabel={
            collaborator.display_name
              ? `Collaborator ${collaborator.display_name}`
              : collaborator.email
                ? `Collaborator ${collaborator.email}`
                : "Collaborator"
          }
        >
          {collaborator.avatar_url ? (
            <Image
              source={{ uri: collaborator.avatar_url }}
              className="h-full w-full"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <AppText variant="caption" className="font-sans-semibold text-[10px] text-text">
                {initialsFor(collaborator)}
              </AppText>
            </View>
          )}
        </View>
      ))}
      {remaining > 0 ? (
        <View className="-ml-2 size-7 items-center justify-center rounded-full border border-surface bg-surface-soft">
          <AppText variant="caption" className="font-sans-semibold text-[10px] text-text">
            +{remaining}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}


