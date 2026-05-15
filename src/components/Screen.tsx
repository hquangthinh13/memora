import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { cn } from "@/lib/cn";
import { SafeAreaView } from "./SafeAreaView";

type ScreenProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
};

export function Screen({
  children,
  className,
  contentClassName,
  scroll = false,
}: ScreenProps) {
  return (
    <SafeAreaView className={cn("flex-1 bg-background", className)}>
      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn(
            "gap-screen-gap px-screen-x py-screen-y",
            contentClassName,
          )}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View
          className={cn(
            "flex-1 gap-screen-gap px-screen-x py-screen-y",
            contentClassName,
          )}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
