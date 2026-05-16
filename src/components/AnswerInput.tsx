import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import type { Question } from "@/services/questions";
import { AppButton } from "./AppButton";
import { AppInput } from "./AppInput";
import { AppText } from "./AppText";
import { cn } from "@/lib/cn";

type AnswerInputProps = {
  question: Question;
  options: string[];
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
};

const optionClasses = [
  "bg-mint-soft border-mint",
  "bg-lavender-soft border-lavender",
  "bg-yellow-soft border-yellow-soft",
  "bg-pink-soft border-pink-soft",
];

export function AnswerInput({
  question,
  options,
  selectedAnswer,
  onAnswer,
}: AnswerInputProps) {
  const [textAnswer, setTextAnswer] = useState("");
  const isTextMode =
    question.type === "fill_in_the_blank" || question.type === "short_answer";

  useEffect(() => {
    setTextAnswer("");
  }, [question.id]);

  if (isTextMode) {
    return (
      <View className="gap-3 rounded-lg border border-border bg-surface-soft p-4">
        <AppInput
          label="Your answer"
          placeholder="Type your answer"
          value={textAnswer}
          editable={!selectedAnswer}
          onChangeText={setTextAnswer}
        />
        <AppButton
          title="Submit answer"
          disabled={!textAnswer.trim() || Boolean(selectedAnswer)}
          onPress={() => onAnswer(textAnswer)}
        />
      </View>
    );
  }

  return (
    <View className="gap-3">
      {options.map((option, index) => {
        const selected = selectedAnswer === option;

        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.85}
            disabled={Boolean(selectedAnswer)}
            onPress={() => onAnswer(option)}
            className={cn(
              "min-h-16 justify-center rounded-lg border px-5 py-4",
              optionClasses[index % optionClasses.length],
              selected && "border-2 border-text",
              selectedAnswer && !selected && "opacity-60",
            )}
          >
            <AppText variant="body" className="font-sans-semibold">
              {option}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
