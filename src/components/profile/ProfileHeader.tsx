import { Image, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import {
  BookOpen02Icon,
  Quiz02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

import Images from "@/constants/images";
import { AppCard, AppText } from "@/components/shared";
import { MetaPill } from "@/components/decks";

type ProfileHeaderProps = {
  avatarUrl: string | null | undefined;
  displayName: string;
  email?: string | null;
  friendCount: number;
  deckCount: number;
  topicCount: number;
};

export function ProfileHeader({
  avatarUrl,
  displayName,
  email,
  friendCount,
  deckCount,
  topicCount,
}: ProfileHeaderProps) {
  return (
    <View className="gap-4 pt-6">
      <View className="items-center gap-3 py-2">
        <View className="items-center justify-center">
          <ExpoImage
            source={Images.floral01}
            style={{
              width: 88,
              height: 88,
              opacity: 0.45,
              position: "absolute",
              top: -8,
              left: -46,
              transform: [{ rotate: "-18deg" }, { scale: 0.95 }],
            }}
            contentFit="contain"
          />
          <ExpoImage
            source={Images.floral01}
            style={{
              width: 94,
              height: 94,
              opacity: 0.32,
              position: "absolute",
              top: -20,
              right: -54,
              transform: [{ rotate: "22deg" }, { scale: 1.05 }],
            }}
            contentFit="contain"
          />
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              className="size-24 rounded-full bg-surface-soft"
            />
          ) : (
            <View className="size-24 items-center justify-center rounded-full bg-lavender">
              <AppText variant="title" className="text-3xl">
                {displayName.slice(0, 1).toUpperCase()}
              </AppText>
            </View>
          )}
        </View>

        <View className="items-center gap-1">
          <AppText variant="title">{displayName}</AppText>
          {email ? <AppText variant="caption">{email}</AppText> : null}
        </View>
      </View>

      <View className="flex-row gap-2">
        <AppCard className="flex-1 items-center gap-1 bg-mint-soft py-3">
          <MetaPill icon={UserGroupIcon} label={`${friendCount} friends`} />
        </AppCard>

        <AppCard className="flex-1 items-center gap-1 bg-peach-soft py-3">
          <MetaPill
            icon={BookOpen02Icon}
            label={`${deckCount} decks`}
          />
        </AppCard>

        <AppCard className="flex-1 items-center gap-1 bg-lavender-soft py-3">
          <MetaPill icon={Quiz02Icon} label={`${topicCount} topics`} />
        </AppCard>
      </View>
    </View>
  );
}
