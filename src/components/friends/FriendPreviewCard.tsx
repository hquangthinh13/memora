import { Image, View } from "react-native";

import { AppCard, AppText } from "@/components/shared";
import type { FriendWithProfile } from "@/services/friends";

type FriendPreviewCardProps = {
  friend: FriendWithProfile;
};

export function FriendPreviewCard({ friend }: FriendPreviewCardProps) {
  const name = friend.friend.display_name ?? friend.friend.email ?? "Friend";

  return (
    <AppCard className="mr-3 w-56 gap-3">
      <View className="flex-row items-center gap-3">
        {friend.friend.avatar_url ? (
          <Image
            source={{ uri: friend.friend.avatar_url }}
            className="size-12 rounded-xl bg-surface-soft"
          />
        ) : (
          <View className="size-12 items-center justify-center rounded-xl bg-mint-soft">
            <AppText variant="subtitle">{name.slice(0, 1).toUpperCase()}</AppText>
          </View>
        )}
        <View className="flex-1">
          <AppText variant="body" className="font-sans-semibold" numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="caption" className="text-text-muted" numberOfLines={1}>
            {friend.friend.email ?? "No email"}
          </AppText>
        </View>
      </View>
    </AppCard>
  );
}

