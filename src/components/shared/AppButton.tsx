import type { ComponentProps, ReactNode } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { HugeiconsIcon, type HugeiconsProps } from "@hugeicons/react-native";

import { cn } from "@/lib/cn";

type AppButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "destructive"
  | "outline";
type AppButtonLayout = "default" | "icon-only" | "icon-leading";

type AppButtonProps = Omit<
  ComponentProps<typeof TouchableOpacity>,
  "children"
> & {
  title?: string;
  children?: ReactNode;
  variant?: AppButtonVariant;
  layout?: AppButtonLayout;

  icon?: HugeiconsProps["icon"];
  iconSize?: number;
  iconColor?: string;
  iconStrokeWidth?: number;

  className?: string;
  textClassName?: string;
  iconClassName?: string;
};

const buttonVariantClasses: Record<AppButtonVariant, string> = {
  primary: "bg-primary",
  secondary: "border border-border bg-surface-soft",
  ghost: "bg-transparent",
  destructive: "bg-transparent",
  outline: "border border-border bg-transparent",
};

const textVariantClasses: Record<AppButtonVariant, string> = {
  primary: "text-primary-foreground",
  secondary: "text-text",
  ghost: "text-text",
  destructive: "text-danger",
  outline: "text-text",
};

const defaultIconColor: Record<AppButtonVariant, string> = {
  primary: "#ffffff",
  secondary: "#111015",
  ghost: "#111015",
  destructive: "#EF6F6C",
  outline: "#111015",
};

const layoutClasses: Record<AppButtonLayout, string> = {
  default: "px-5",
  "icon-only": "h-12 w-12",
  "icon-leading": "flex-row gap-2 px-5",
};

export function AppButton({
  title,
  children,
  variant = "primary",
  layout = "default",

  icon,
  iconSize = 20,
  iconColor,
  iconStrokeWidth = 2,

  className,
  textClassName,
  iconClassName,

  disabled,
  ...props
}: AppButtonProps) {
  const resolvedIconColor = iconColor ?? defaultIconColor[variant];
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      className={cn(
        "min-h-12 items-center justify-center rounded-md",
        buttonVariantClasses[variant],
        layoutClasses[layout],
        disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      {children ? (
        children
      ) : layout === "icon-only" ? (
        <View className={cn("items-center justify-center", iconClassName)}>
          {icon ? (
            <HugeiconsIcon
              icon={icon}
              size={iconSize}
              color={resolvedIconColor}
              strokeWidth={iconStrokeWidth}
            />
          ) : null}
        </View>
      ) : layout === "icon-leading" ? (
        <View className="flex-row items-center gap-2">
          {icon ? (
            <View className={iconClassName}>
              <HugeiconsIcon
                icon={icon}
                size={iconSize}
                color={resolvedIconColor}
                strokeWidth={iconStrokeWidth}
              />
            </View>
          ) : null}

          {title ? (
            <Text
              className={cn(
                "font-sans-semibold text-base",
                textVariantClasses[variant],
                textClassName,
              )}
            >
              {title}
            </Text>
          ) : null}
        </View>
      ) : (
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
    </TouchableOpacity>
  );
}
