import type { ReactNode } from "react";
import { Image, View } from "react-native";

import { AppText } from "./AppText";

type UserItemProps = {
  name: string;
  subtitle?: string;
  avatarUrl?: string | null;
  action?: ReactNode;
};

export function UserItem({ name, subtitle, avatarUrl, action }: UserItemProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-3xl border border-border bg-surface p-4">
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} className="size-12 rounded-full bg-surface-soft" />
      ) : (
        <View className="size-12 items-center justify-center rounded-full bg-mint">
          <AppText variant="subtitle">{name.slice(0, 1).toUpperCase()}</AppText>
        </View>
      )}
      <View className="flex-1">
        <AppText variant="body" className="font-sans-semibold">
          {name}
        </AppText>
        {subtitle ? <AppText variant="caption">{subtitle}</AppText> : null}
      </View>
      {action}
    </View>
  );
}
