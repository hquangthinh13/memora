import { View } from "react-native";

import { AppButton, AppText } from "@/components/shared";

type ProfileSectionHeaderProps = {
  title: string;
  actionTitle?: string;
  onPressAction?: () => void;
};

export function ProfileSectionHeader({
  title,
  actionTitle,
  onPressAction,
}: ProfileSectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <AppText variant="subtitle">{title}</AppText>
      {actionTitle && onPressAction ? (
        <AppButton
          title={actionTitle}
          variant="secondary"
          className="min-h-9 rounded-full px-4"
          textClassName="text-sm"
          onPress={onPressAction}
        />
      ) : null}
    </View>
  );
}

