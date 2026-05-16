import { useState } from "react";
import { View } from "react-native";

import type { Question } from "@/services/questions";
import { AppButton } from "./AppButton";
import { AppInput } from "./AppInput";

type AnswerInputProps = {
  question: Question;
  options: string[];
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
};

export function AnswerInput({
  question,
  options,
  selectedAnswer,
  onAnswer,
}: AnswerInputProps) {
  const [textAnswer, setTextAnswer] = useState("");
  const isTextMode =
    question.type === "fill_in_the_blank" || question.type === "short_answer";

  if (isTextMode) {
    return (
      <View className="gap-3">
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
      {options.map((option) => (
        <AppButton
          key={option}
          title={option}
          variant={selectedAnswer === option ? "primary" : "secondary"}
          disabled={Boolean(selectedAnswer)}
          onPress={() => onAnswer(option)}
        />
      ))}
    </View>
  );
}
