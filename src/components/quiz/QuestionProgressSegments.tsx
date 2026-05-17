import { View } from "react-native";

import { cn } from "@/lib/cn";
import { AppText } from "@/components/shared";

type QuestionProgressSegmentsProps = {
  currentIndex: number;
  total: number;
  className?: string;
};

export function QuestionProgressSegments({
  currentIndex,
  total,
  className,
}: QuestionProgressSegmentsProps) {
  if (total <= 0) return null;

  const gapClass = total > 16 ? "gap-1" : "gap-1.5";

  return (
    <View className={cn("gap-2 px-1 py-2", className)}>
      <AppText variant="caption" className="text-center font-sans-semibold">
        Question {currentIndex + 1}/{total}
      </AppText>

      <View className={cn("flex-row items-center justify-center", gapClass)}>
        {Array.from({ length: total }).map((_, idx) => {
          const isReached = idx <= currentIndex;

          return (
            <View
              key={idx}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                isReached ? "bg-text" : "bg-border",
              )}
            />
          );
        })}
      </View>
    </View>
  );
}
