import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type StaticFlashcardProps = {
  front: string;
  back: string;
  hint?: string | null;
};

export function StaticFlashcard({ front, back, hint }: StaticFlashcardProps) {
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
      {hint ? <AppText variant="caption">Hint: {hint}</AppText> : null}
    </AppCard>
  );
}
