import { AppCard } from "./AppCard";
import { AppText } from "./AppText";
import { View } from "react-native";
type StaticFlashcardProps = {
  front: string;
  back: string;
  explanation?: string | null;
  tags?: string[];
};

export function StaticFlashcard({
  front,
  back,
  explanation,
  tags = [],
}: StaticFlashcardProps) {
  return (
    <AppCard className="gap-3">
      <AppText variant="caption" className="font-sans-medium text-text">
        Question
      </AppText>
      <AppText variant="subtitle">{front}</AppText>
      <AppText
        variant="caption"
        className="border-t border-border pt-3 font-sans-medium text-text"
      >
        Answer
      </AppText>
      <AppText variant="subtitle" className="">
        {back}
      </AppText>
      {explanation ? (
        <AppText variant="caption">Explanation: {explanation}</AppText>
      ) : null}
      {tags.length ? (
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <View
              key={tag}
              className="rounded-md border border-peach bg-peach-soft px-3 py-1"
            >
              <AppText
                variant="caption"
                className="font-sans-semibold text-text text-xs"
              >
                {tag}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {/* 
      {tags.length ? (
        <AppText variant="caption">Tags: {tags.join(", ")}</AppText>
      ) : null} */}
    </AppCard>
  );
}
