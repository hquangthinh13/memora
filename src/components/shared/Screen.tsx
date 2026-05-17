import type { ReactNode } from "react";
import { useRef } from "react";
import { Animated, ScrollView, View } from "react-native";

import { cn } from "@/lib/cn";
import { SafeAreaView } from "./SafeAreaView";

type ScreenProps = {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  contentClassName?: string;
  scroll?: boolean;
  headerFade?: boolean;
};
export function Screen({
  children,
  header,
  className,
  contentClassName,
  scroll = false,
  headerFade = true,
}: ScreenProps) {
  const scrollY = useRef(new Animated.Value(0)).current;
  const shouldFadeHeader = Boolean(header && scroll && headerFade);

  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 64],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <SafeAreaView className={cn("flex-1 bg-background pb-24", className)}>
      {header ? (
        <View className="relative z-10 px-screen-x pt-screen-y pb-3">
          {shouldFadeHeader ? (
            <Animated.View
              pointerEvents="none"
              className="absolute inset-0 bg-background"
              style={{ opacity: headerBackgroundOpacity }}
            />
          ) : (
            <View
              pointerEvents="none"
              className="absolute inset-0 bg-background"
            />
          )}
          {header}
        </View>
      ) : null}

      {scroll ? (
        <Animated.ScrollView
          className="flex-1"
          contentContainerClassName={cn(
            "gap-screen-gap px-screen-x pb-screen-y",
            contentClassName,
          )}
          onScroll={
            shouldFadeHeader
              ? Animated.event(
                  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                  { useNativeDriver: false },
                )
              : undefined
          }
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </Animated.ScrollView>
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
