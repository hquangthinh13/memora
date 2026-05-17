import type { ComponentProps } from "react";
import { TextInput, View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./AppText";

type AppInputProps = ComponentProps<typeof TextInput> & {
  label?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
};

export function AppInput({
  label,
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  placeholderTextColor = "#9B918D",
  ...props
}: AppInputProps) {
  return (
    <View className={cn("gap-2", className)}>
      {label ? (
        <AppText
          variant="caption"
          className={cn("font-sans-medium text-text", labelClassName)}
        >
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={placeholderTextColor}
        className={cn(
          "min-h-12 rounded-md border bg-surface px-4 font-sans text-base text-text",
          error ? "border-danger" : "border-border",
          inputClassName,
        )}
        {...props}
      />
      {error ? (
        <AppText
          variant="caption"
          className={cn("text-danger", errorClassName)}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
