import type { ComponentProps, ReactNode } from "react";
import { Pressable, Text } from "react-native";

import { cn } from "@/lib/cn";

type AppButtonVariant = "primary" | "secondary" | "ghost";

type AppButtonProps = Omit<ComponentProps<typeof Pressable>, "children"> & {
  title?: string;
  children?: ReactNode;
  variant?: AppButtonVariant;
  className?: string;
  textClassName?: string;
};

const buttonVariantClasses: Record<AppButtonVariant, string> = {
  primary: "bg-primary active:opacity-80",
  secondary: "border border-border bg-surface-soft active:bg-yellow-soft",
  ghost: "bg-transparent active:bg-pink-soft",
};

const textVariantClasses: Record<AppButtonVariant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-text",
  ghost: "text-text",
};

export function AppButton({
  title,
  children,
  variant = "primary",
  className,
  textClassName,
  disabled,
  ...props
}: AppButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      className={cn(
        "min-h-12 items-center justify-center rounded-full px-5",
        buttonVariantClasses[variant],
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {children ?? (
        <Text
          className={cn(
            "font-sans-semibold text-base",
            textVariantClasses[variant],
            textClassName,
          )}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
