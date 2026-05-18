import type { ComponentProps } from "react";
import { TextInput, View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "./AppText";

type AppInputProps = ComponentProps<typeof TextInput> & {
  label?: string;
  description?: string;
  isRequired?: boolean;
  error?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  descriptionClassName?: string;
};

export function AppInput({
  label,
  description,
  isRequired = false,
  error,
  className,
  inputClassName,
  labelClassName,
  errorClassName,
  descriptionClassName,
  placeholderTextColor = "#9B918D",
  ...props
}: AppInputProps) {
  return (
    <View className={cn("gap-2", className)}>
      {label ? (
        <View className="flex-row items-center gap-2">
          <AppText
            variant="caption"
            className={cn("font-sans-medium text-text", labelClassName)}
          >
            {label}
            {isRequired ? <AppText className="text-danger"> *</AppText> : null}
          </AppText>

          {description ? (
            <AppText
              variant="caption"
              className={cn(
                "text-muted-foreground text-xs ml-auto",
                descriptionClassName,
              )}
            >
              {description}
            </AppText>
          ) : null}
        </View>
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
