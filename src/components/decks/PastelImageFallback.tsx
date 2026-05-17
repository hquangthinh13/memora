import { View } from "react-native";

import { AppText } from "@/components/shared";

type PastelImageFallbackProps = {
  title: string;
  className?: string;
};

const tones = ["bg-peach-soft", "bg-mint-soft", "bg-lavender-soft", "bg-surface-soft"];

export function PastelImageFallback({ title, className }: PastelImageFallbackProps) {
  const tone = tones[title.length % tones.length];

  return (
    <View className={`h-40 w-full items-center justify-center ${tone} ${className ?? ""}`}>
      <AppText variant="title" className="text-4xl">
        {title.slice(0, 1).toUpperCase()}
      </AppText>
    </View>
  );
}


