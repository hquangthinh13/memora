import type { ComponentProps } from "react";
import { View } from "react-native";

import { cn } from "@/lib/cn";

type AppCardProps = ComponentProps<typeof View> & {
  className?: string;
};

export function AppCard({ className, ...props }: AppCardProps) {
  return (
    <View
      className={cn(
        "rounded-3xl border border-border bg-surface p-card",
        className,
      )}
      {...props}
    />
  );
}
