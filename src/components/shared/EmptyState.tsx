import { View } from "react-native";
import { Image } from "expo-image";

import { cn } from "@/lib/cn";
import Images from "@/constants/images";
import { AppText } from "./AppText";

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
  showIllustration?: boolean;
};

export function EmptyState({
  title,
  description,
  className,
  showIllustration = false,
}: EmptyStateProps) {
  return (
    <View
      className={cn(
        "gap-0 rounded-lg border border-border bg-surface-soft p-card",
        className,
      )}
    >
      {showIllustration ? (
        <View className="items-center mb-3">
          <Image
            source={Images.floral02}
            style={{ width: 88, height: 88, opacity: 0.7 }}
            contentFit="contain"
          />
        </View>
      ) : null}
      <AppText variant="subtitle">{title}</AppText>
      {description ? (
        <AppText variant="caption" className="mt-1">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
