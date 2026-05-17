import { ActivityIndicator, View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./AppText";

type LoadingStateProps = {
  label?: string;
  size?: "sm" | "md";
  center?: boolean;
  className?: string;
};

export function LoadingState({
  label = "Loading...",
  size = "md",
  center = true,
  className,
}: LoadingStateProps) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-2",
        center && "justify-center",
        className,
      )}
    >
      <ActivityIndicator
        size={size === "sm" ? "small" : "large"}
        color="#7A7270"
      />
      <AppText variant="caption" className="text-text-muted">
        {label}
      </AppText>
    </View>
  );
}
