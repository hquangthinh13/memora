import { GlobeIcon, LockKeyIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { View } from "react-native";

import { AppText } from "@/components/shared";
import type { Deck } from "@/services/decks";

type VisibilityBadgeProps = {
  visibility: Deck["visibility"];
};

export function VisibilityBadge({ visibility }: VisibilityBadgeProps) {
  const isPublic = visibility === "PUBLIC";

  return (
    <View className="flex-row items-center gap-1 px-0 py-0">
      <HugeiconsIcon icon={isPublic ? GlobeIcon : LockKeyIcon} size={13} color="#706A68" />
      <AppText variant="caption" className="font-sans-medium text-text-muted">
        {isPublic ? "Public" : "Private"}
      </AppText>
    </View>
  );
}


