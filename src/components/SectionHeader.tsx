import type { ReactNode } from "react";
import { View } from "react-native";
import { router, Href } from "expo-router";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { AppText } from "./AppText";
import { AppButton } from "./AppButton";
import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  variant?: "section" | "detail";
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  onBackPress?: () => void;
  backHref?: Href;
};

export function SectionHeader({
  variant = "section",
  title,
  description,
  children,
  className,
  onBackPress,
  backHref,
}: SectionHeaderProps) {
  if (variant === "detail") {
    return (
      <View
        className={cn(
          "relative h-12 flex-row items-center justify-between",
          className,
        )}
      >
        <View className="z-10 items-start">
          <AppButton
            variant="outline"
            layout="icon-only"
            icon={ArrowLeft01Icon}
            onPress={() => {
              if (onBackPress) {
                onBackPress();
                return;
              }

              if (backHref) {
                router.replace(backHref);
                return;
              }

              router.back();
            }}
          />
        </View>

        <View className="absolute inset-x-12 items-center">
          <AppText variant="subtitle" className="text-center" numberOfLines={1}>
            {title}
          </AppText>
        </View>

        <View className="z-10 items-end justify-center">{children}</View>
      </View>
    );
  }

  return (
    <View className={className}>
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <AppText variant="title">{title}</AppText>

          {description ? (
            <AppText variant="body" className="mt-1 text-text-muted">
              {description}
            </AppText>
          ) : null}
        </View>

        {children ? <View className="shrink-0">{children}</View> : null}
      </View>
    </View>
  );
}
