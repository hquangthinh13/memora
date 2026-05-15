import { View } from "react-native";

import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type PlaceholderListProps = {
  items: Array<{
    title: string;
    description: string;
    tone?: string;
  }>;
};

export function PlaceholderList({ items }: PlaceholderListProps) {
  return (
    <View className="gap-3">
      {items.map((item) => (
        <AppCard
          key={item.title}
          className={item.tone ?? "bg-surface"}
        >
          <AppText variant="subtitle">{item.title}</AppText>
          <AppText variant="caption" className="mt-2">
            {item.description}
          </AppText>
        </AppCard>
      ))}
    </View>
  );
}
