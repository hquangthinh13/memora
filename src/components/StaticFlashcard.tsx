import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type StaticFlashcardProps = {
  front: string;
  back: string;
  explanation?: string | null;
  tags?: string[];
};

export function StaticFlashcard({ front, back, explanation, tags = [] }: StaticFlashcardProps) {
  return (
    <AppCard className="gap-3">
      <AppText variant="caption" className="font-sans-medium text-text">
        Front
      </AppText>
      <AppText variant="subtitle">{front}</AppText>
      <AppText variant="caption" className="font-sans-medium text-text">
        Back
      </AppText>
      <AppText variant="body" className="text-text-muted">
        {back}
      </AppText>
      {explanation ? (
        <AppText variant="caption">Explanation: {explanation}</AppText>
      ) : null}
      {tags.length ? (
        <AppText variant="caption">Tags: {tags.join(", ")}</AppText>
      ) : null}
    </AppCard>
  );
}
