import { View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./AppText";

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <View className={cn("rounded-3xl border border-border bg-surface-soft p-card", className)}>
      <AppText variant="subtitle">{title}</AppText>
      {description ? (
        <AppText variant="caption" className="mt-2">
          {description}
        </AppText>
      ) : null}
    </View>
  );
}
