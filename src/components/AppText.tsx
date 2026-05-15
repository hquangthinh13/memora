import type { ComponentProps } from "react";
import { Text } from "react-native";

import { cn } from "@/lib/cn";

type AppTextVariant = "title" | "subtitle" | "body" | "caption";

type AppTextProps = ComponentProps<typeof Text> & {
  variant?: AppTextVariant;
  className?: string;
};

const variantClasses: Record<AppTextVariant, string> = {
  title: "font-sans-bold text-3xl leading-tight text-text",
  subtitle: "font-sans-semibold text-lg leading-7 text-text",
  body: "font-sans text-base leading-6 text-text",
  caption: "font-sans text-sm leading-5 text-text-muted",
};

export function AppText({
  variant = "body",
  className,
  ...props
}: AppTextProps) {
  return (
    <Text
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  );
}
