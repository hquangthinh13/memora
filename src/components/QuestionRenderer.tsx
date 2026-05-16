import { AppCard } from "./AppCard";
import { AppText } from "./AppText";
import type { Question } from "@/services/questions";

type QuestionRendererProps = {
  question: Question;
  index: number;
  total: number;
};

export function QuestionRenderer({ question, index, total }: QuestionRendererProps) {
  return (
    <AppCard className="gap-3 bg-peach-soft">
      <AppText variant="caption">
        Question {index + 1} of {total} - {question.type.replace(/_/g, " ")}
      </AppText>
      <AppText variant="subtitle">{question.question}</AppText>
      <AppText variant="caption">
        Difficulty {question.difficulty}/5 - {question.time_limit}s
      </AppText>
    </AppCard>
  );
}
