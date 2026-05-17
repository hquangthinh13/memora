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
  "bg-mint-soft border-mint",
  "bg-lavender-soft border-lavender",
  "bg-yellow-soft border-yellow-soft",
  "bg-pink-soft border-pink-soft",
];

// True / False — two large distinct cards
function TrueFalseInput({
  options,
  selectedAnswer,
  onAnswer,
}: {
  options: string[];
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
}) {
  const trueSelected = selectedAnswer === "True";
  const falseSelected = selectedAnswer === "False";

  return (
    <View className="gap-3">
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={Boolean(selectedAnswer)}
        onPress={() => onAnswer("True")}
        className={cn(
          "min-h-20 items-center justify-center rounded-lg border-2 px-5 py-5",
          trueSelected ? "border-text bg-mint" : "border-mint bg-mint-soft",
          selectedAnswer && !trueSelected && "opacity-50",
        )}
      >
        <AppText variant="title" className={cn("text-2xl", trueSelected && "text-text")}>
          True
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={Boolean(selectedAnswer)}
        onPress={() => onAnswer("False")}
        className={cn(
          "min-h-20 items-center justify-center rounded-lg border-2 px-5 py-5",
          falseSelected ? "border-text bg-pink" : "border-pink-soft bg-pink-soft",
          selectedAnswer && !falseSelected && "opacity-50",
        )}
      >
        <AppText variant="title" className={cn("text-2xl", falseSelected && "text-text")}>
          False
        </AppText>
      </TouchableOpacity>
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
      {isShortAnswer ? (
        <AppInput
          label="Your answer"
          placeholder="Write a brief answer..."
          value={text}
          editable={!selectedAnswer}
          onChangeText={setText}
          multiline
          numberOfLines={3}
          inputClassName="min-h-20 py-3"
        />
      ) : (
        <AppInput
          label="Fill in the blank"
          placeholder="Type the missing word(s)..."
          value={text}
          editable={!selectedAnswer}
          onChangeText={setText}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
      <AppButton
        title="Submit answer"
        disabled={!text.trim() || Boolean(selectedAnswer)}
        onPress={() => onAnswer(text.trim())}
      />
    </View>
  );
}

// MCQ — colored option cards
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
            <AppText variant="body" className="font-sans-semibold">
              {option}
            </AppText>
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



