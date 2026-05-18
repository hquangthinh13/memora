import { useEffect, useState } from "react";
import { CancelCircleIcon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { TouchableOpacity, View } from "react-native";

import type { Question } from "@/services/questions";
import { cn } from "@/lib/cn";
import { AppButton } from "@/components/shared";
import { AppInput } from "@/components/shared";
import { AppText } from "@/components/shared";
import { ResultAnswerSection } from "./ResultAnswerSection";

type AnswerInputProps = {
  question: Question;
  options: string[];
  selectedAnswer: string | null;
  answerResult?: {
    answer: string;
    correct: boolean;
    timedOut?: boolean;
  } | null;
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

function acceptedAnswers(question: Question) {
  if (typeof question.correct_answer === "string") return [question.correct_answer];
  if (Array.isArray(question.correct_answer)) return question.correct_answer.map(String);
  return [];
}

function correctAnswerText(question: Question) {
  return acceptedAnswers(question).join(", ");
}

function isCorrectOption(question: Question, option: string) {
  return acceptedAnswers(question).some((answer) => answer === option);
}

function feedbackState({
  question,
  option,
  selectedAnswer,
  answerResult,
}: {
  question: Question;
  option: string;
  selectedAnswer: string | null;
  answerResult?: AnswerInputProps["answerResult"];
}) {
  if (!answerResult || !selectedAnswer) return "idle";
  if (isCorrectOption(question, option)) return "correct";
  if (!answerResult.timedOut && selectedAnswer === option && !answerResult.correct) {
    return "wrong";
  }
  return "muted";
}

function FeedbackIcon({ state }: { state: "correct" | "wrong" }) {
  const isCorrect = state === "correct";

  return (
    <View
      className={cn(
        "h-7 w-7 items-center justify-center rounded-full",
        isCorrect ? "bg-mint" : "bg-danger",
      )}
    >
      <HugeiconsIcon
        icon={isCorrect ? CheckmarkCircle01Icon : CancelCircleIcon}
        size={18}
        color="#ffffff"
        strokeWidth={2.2}
      />
    </View>
  );
}

function answerCardClasses(state: "idle" | "correct" | "wrong" | "muted") {
  switch (state) {
    case "correct":
      return "border-mint bg-mint-soft";
    case "wrong":
      return "border-danger bg-danger/10";
    case "muted":
      return "border-border bg-surface-soft opacity-45";
    default:
      return "border-border bg-surface";
  }
}

// True / False - two large distinct cards
function TrueFalseInput({
  question,
  options,
  selectedAnswer,
  answerResult,
  onAnswer,
}: {
  question: Question;
  options: string[];
  selectedAnswer: string | null;
  answerResult?: AnswerInputProps["answerResult"];
  onAnswer: (answer: string) => void;
}) {
  return (
    <View className="flex-row gap-3">
      {(options.length ? options : ["True", "False"]).map((option) => {
        const state = feedbackState({ question, option, selectedAnswer, answerResult });
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.85}
            disabled={Boolean(selectedAnswer)}
            onPress={() => onAnswer(option)}
            className={cn(
              "min-h-16 flex-1 items-center justify-center rounded-lg border px-4 py-4",
              answerCardClasses(state),
            )}
          >
            <View className="items-center gap-2">
              {(state === "correct" || state === "wrong") ? <FeedbackIcon state={state} /> : null}
              <AppText variant="subtitle" className="text-center">
                {option}
              </AppText>
            </View>
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
  answerResult,
  onAnswer,
}: {
  question: Question;
  selectedAnswer: string | null;
  answerResult?: AnswerInputProps["answerResult"];
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
      {answerResult ? (
        <View className="gap-2">
          <ResultAnswerSection
            label="Your answer"
            value={answerResult.timedOut ? "Timed out" : answerResult.answer}
            className={answerResult.correct ? "border-mint bg-mint-soft" : "border-danger bg-danger/10"}
          />
          <ResultAnswerSection
            label="Correct answer"
            value={correctAnswerText(question)}
            className="border-mint bg-mint-soft"
          />
        </View>
      ) : null}
    </View>
  );
}

// MCQ - neutral option cards
function McqInput({
  question,
  options,
  selectedAnswer,
  answerResult,
  onAnswer,
}: {
  question: Question;
  options: string[];
  selectedAnswer: string | null;
  answerResult?: AnswerInputProps["answerResult"];
  onAnswer: (answer: string) => void;
}) {
  return (
    <View className="gap-3">
      {options.map((option, index) => {
        const state = feedbackState({ question, option, selectedAnswer, answerResult });
        const optionLabel = optionLabelFor(index);
        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.85}
            disabled={Boolean(selectedAnswer)}
            onPress={() => onAnswer(option)}
            className={cn(
              "min-h-16 justify-center rounded-lg border px-5 py-4",
              answerResult ? answerCardClasses(state) : MCQ_OPTION_CLASSES[index % MCQ_OPTION_CLASSES.length],
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
              {(state === "correct" || state === "wrong") ? <FeedbackIcon state={state} /> : null}
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
  answerResult,
  onAnswer,
}: AnswerInputProps) {
  if (question.type === "true_false") {
    return (
      <TrueFalseInput
        question={question}
        options={options}
        selectedAnswer={selectedAnswer}
        answerResult={answerResult}
        onAnswer={onAnswer}
      />
    );
  }

  if (question.type === "fill_in_the_blank" || question.type === "short_answer") {
    return (
      <TextAnswerInput
        question={question}
        selectedAnswer={selectedAnswer}
        answerResult={answerResult}
        onAnswer={onAnswer}
      />
    );
  }

  return (
    <McqInput
      question={question}
      options={options}
      selectedAnswer={selectedAnswer}
      answerResult={answerResult}
      onAnswer={onAnswer}
    />
  );
}



