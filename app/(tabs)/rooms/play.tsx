import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";

import { AppButton, AppCard, AppText, PlaceholderList, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useRoom } from "@/hooks/useRoom";
import { getErrorMessage } from "@/lib/errors";

function asOptions(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

export default function RoomPlayScreen() {
  const router = useRouter();
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();
  const { user } = useAuth();
  const room = useRoom(roomId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options = useMemo(
    () => asOptions(room.activeQuestion?.options),
    [room.activeQuestion?.options],
  );
  const currentAnswer = useMemo(
    () =>
      room.answers.find(
        (answer) =>
          answer.question_id === room.activeQuestion?.id &&
          answer.user_id === user?.id,
      ),
    [room.activeQuestion?.id, room.answers, user?.id],
  );

  async function handleAnswer(answer: string) {
    if (!user || !room.room || !room.activeQuestion) return;

    const correct = answer === room.activeQuestion.correct_answer;
    setSubmitting(true);
    setError(null);

    try {
      await room.submitRoomAnswer({
        room_id: room.room.id,
        question_id: room.activeQuestion.id,
        user_id: user.id,
        answer,
        is_correct: correct,
        response_ms: 0,
        score: correct ? room.activeQuestion.points : 0,
      });
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not submit answer."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (!room.room) return;

    const nextIndex = room.room.current_question_index + 1;

    if (nextIndex >= room.questions.length) {
      await room.updateRoom(room.room.id, {
        status: "FINISHED",
        ended_at: new Date().toISOString(),
      });
      router.push(`/rooms/result?roomId=${room.room.id}`);
      return;
    }

    await room.updateRoom(room.room.id, {
      current_question_index: nextIndex,
    });
  }

  return (
    <Screen scroll>
      <AppText variant="title">Room play</AppText>
      {room.loading ? <AppText variant="caption">Loading room...</AppText> : null}
      {room.error ? <AppText variant="caption" className="text-danger">{room.error}</AppText> : null}
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

      {room.activeQuestion ? (
        <>
          <AppCard className="gap-3 bg-peach">
            <AppText variant="subtitle">{room.activeQuestion.prompt}</AppText>
            <AppText variant="caption">
              Question {room.activeQuestion.index + 1} of {room.questions.length}
            </AppText>
          </AppCard>

          <PlaceholderList
            items={options.map((option) => ({
              title: option,
              description: "Tap to answer",
              tone: "bg-surface",
            }))}
          />

          {options.map((option) => (
            <AppButton
              key={option}
              title={option}
              disabled={submitting || Boolean(currentAnswer)}
              onPress={() => void handleAnswer(option)}
            />
          ))}

          <AppButton title="Next question" variant="primary" onPress={() => void handleNext()} />
        </>
      ) : (
        <AppCard>
          <AppText variant="subtitle">No active question</AppText>
          <AppText variant="caption" className="mt-2">
            Return to the lobby and start the room.
          </AppText>
        </AppCard>
      )}
    </Screen>
  );
}
