import { View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "@/components/shared";

type ResultAnswerSectionProps = {
  label: string;
  value: string;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export function ResultAnswerSection({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}: ResultAnswerSectionProps) {
  return (
    <View className={cn("rounded-lg border p-4", className)}>
      <AppText
        variant="caption"
        className={cn(
          "font-sans-medium text-text-muted text-xs uppercase tracking-wide",
          labelClassName,
        )}
      >
        {label}
      </AppText>
      <AppText
        variant="body"
        className={cn("mt-2 font-sans-semibold text-text", valueClassName)}
      >
        {value}
      </AppText>
    </View>
  );
}
