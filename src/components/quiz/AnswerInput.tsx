import { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import type { Question } from "@/services/questions";
import { cn } from "@/lib/cn";
import { AppButton } from "@/components/shared";
import { AppInput } from "@/components/shared";
import { AppText } from "@/components/shared";

type AnswerInputProps = {
  question: Question;
  options: string[];
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
};

const MCQ_OPTION_CLASSES = [
  "bg-surface border-border",
  "bg-surface border-border",
  "bg-surface border-border",
  "bg-surface border-border",
];

function optionLabelFor(index: number) {
  return String.fromCharCode(65 + index);
}

// True / False - two large distinct cards
function TrueFalseInput({
  options,
  selectedAnswer,
  onAnswer,
}: {
  options: string[];
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}) {
  return (
    <View className="flex-row gap-3">
      {(options.length ? options : ["True", "False"]).map((option) => {
        const selected = selectedAnswer === option;
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.85}
            disabled={Boolean(selectedAnswer)}
            onPress={() => onAnswer(option)}
            className={cn(
              "min-h-16 flex-1 items-center justify-center rounded-lg border px-4 py-4",
              selected ? "border-2 border-text bg-surface-soft" : "border-border bg-surface",
              selectedAnswer && !selected && "opacity-50",
            )}
          >
            <AppText variant="subtitle" className="text-center">
              {option}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Text input for fill_in_the_blank and short_answer
function TextAnswerInput({
  question,
  selectedAnswer,
  onAnswer,
}: {
  question: Question;
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}) {
  const [text, setText] = useState("");
  const isShortAnswer = question.type === "short_answer";

  useEffect(() => {
    setText("");
  }, [question.id]);

  return (
    <View className="gap-3 rounded-lg border border-border bg-surface-soft p-4">
      <AppInput
        label={isShortAnswer ? "Short answer" : "Fill in the blank"}
        placeholder={isShortAnswer ? "Type a short answer..." : "Type the missing term..."}
        value={text}
        editable={!selectedAnswer}
        onChangeText={setText}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AppButton
        title="Submit answer"
        disabled={!text.trim() || Boolean(selectedAnswer)}
        onPress={() => onAnswer(text.trim())}
      />
    </View>
  );
}

// MCQ - neutral option cards
function McqInput({
  options,
  selectedAnswer,
  onAnswer,
}: {
  options: string[];
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}) {
  return (
    <View className="gap-3">
      {options.map((option, index) => {
        const selected = selectedAnswer === option;
        const optionLabel = optionLabelFor(index);
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.85}
            disabled={Boolean(selectedAnswer)}
            onPress={() => onAnswer(option)}
            className={cn(
              "min-h-16 justify-center rounded-lg border px-5 py-4",
              MCQ_OPTION_CLASSES[index % MCQ_OPTION_CLASSES.length],
              selected && "border-2 border-text",
              selectedAnswer && !selected && "opacity-60",
            )}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-surface/85">
                <AppText variant="caption" className="font-sans-semibold">
                  {optionLabel}
                </AppText>
              </View>
              <AppText variant="body" className="flex-1 font-sans-semibold">
                {option}
              </AppText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function AnswerInput({
  question,
  options,
  selectedAnswer,
  onAnswer,
}: AnswerInputProps) {
  if (question.type === "true_false") {
    return (
      <TrueFalseInput
        options={options}
        selectedAnswer={selectedAnswer}
        onAnswer={onAnswer}
      />
    );
  }

  if (question.type === "fill_in_the_blank" || question.type === "short_answer") {
    return (
      <TextAnswerInput
        question={question}
        selectedAnswer={selectedAnswer}
        onAnswer={onAnswer}
      />
    );
  }

  return (
    <McqInput options={options} selectedAnswer={selectedAnswer} onAnswer={onAnswer} />
  );
}



