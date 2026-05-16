import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";

import { cn } from "@/lib/cn";
import { SafeAreaView } from "./SafeAreaView";

type ScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
};
export function Screen({
  children,
  header,
  className,
  contentClassName,
  scroll = false,
}: ScreenProps) {
  return (
    <SafeAreaView className={cn("flex-1 bg-background pb-24", className)}>
      {header ? (
        <View className="px-screen-x pt-screen-y pb-3 bg-background z-10">
          {header}
        </View>
      ) : null}

      {scroll ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName={cn(
            "gap-screen-gap px-screen-x pb-screen-y",
            contentClassName,
          )}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View
          className={cn(
            "flex-1 gap-screen-gap px-screen-x pb-screen-y",
            contentClassName,
          )}
        >
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}
