import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";

import { AppButton, AppCard, AppInput, AppText, PlaceholderList, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useDeckDetail } from "@/hooks/useDeckDetail";
import { useDecks } from "@/hooks/useDecks";
import { useRoom } from "@/hooks/useRoom";
import { getErrorMessage } from "@/lib/errors";
import { createRoom, createRoomQuestions, joinRoomByCode, updateRoom } from "@/services/rooms";

export default function RoomLobbyScreen() {
  const router = useRouter();
  const { deckId, roomId } = useLocalSearchParams<{ deckId?: string; roomId?: string }>();
  const { user, profile } = useAuth();
  const { decks } = useDecks();
  const selectedDeckId = deckId ?? decks[0]?.id;
  const { deck } = useDeckDetail(selectedDeckId);
  const room = useRoom(roomId);
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerItems = useMemo(
    () =>
      room.players.map((player) => ({
        title: player.nickname ?? "Learner",
        description: `${player.score} points`,
        tone: "bg-surface",
      })),
    [room.players],
  );

  async function handleCreateRoom() {
    if (!user || !selectedDeckId) return;

    setSubmitting(true);
    setError(null);

    try {
      const created = await createRoom({
        deckId: selectedDeckId,
        hostId: user.id,
        nickname: profile?.display_name,
      });
      router.replace(`/rooms/lobby?roomId=${created.id}&deckId=${selectedDeckId}`);
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not create room."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinRoom() {
    if (!user || !joinCode.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const joined = await joinRoomByCode({
        code: joinCode,
        userId: user.id,
        nickname: profile?.display_name,
      });
      router.replace(`/rooms/lobby?roomId=${joined.id}&deckId=${joined.deck_id}`);
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not join room."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStartRoom() {
    if (!room.room) return;

    setSubmitting(true);
    setError(null);

    try {
      if (deck && room.questions.length === 0) {
        await createRoomQuestions(
          deck.cards.slice(0, 10).map((card, index) => ({
            room_id: room.room!.id,
            card_id: card.id,
            index,
            prompt: card.front ?? "Untitled card",
            correct_answer: card.back ?? "",
            options: [card.back ?? "No answer", "I am not sure", "Review later"],
            points: 100,
            time_limit_sec: room.room!.question_time_limit,
          })),
        );
      }

      await updateRoom(room.room.id, {
        status: "PLAYING",
        current_question_index: 0,
        started_at: new Date().toISOString(),
      });
      router.push(`/rooms/play?roomId=${room.room.id}`);
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not start room."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll>
      <AppText variant="title">Room lobby</AppText>
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

      {room.room ? (
        <>
          <AppCard className="bg-mint">
            <AppText variant="subtitle">Room {room.room.code}</AppText>
            <AppText variant="caption" className="mt-2">
              {room.players.length} participant{room.players.length === 1 ? "" : "s"} waiting.
            </AppText>
          </AppCard>
          <PlaceholderList items={playerItems} />
          <AppButton
            title={submitting ? "Starting..." : "Start room"}
            variant="primary"
            disabled={submitting || !deck?.cards.length}
            onPress={handleStartRoom}
          />
          {!deck?.cards.length ? (
            <AppText variant="caption" className="text-text-muted">
              Add cards to this deck before starting a room.
            </AppText>
          ) : null}
        </>
      ) : (
        <>
          <AppCard className="gap-4 bg-mint">
            <AppText variant="subtitle">Create a room</AppText>
            <AppText variant="caption">
              {selectedDeckId ? "Use your first readable deck or the selected deck." : "Create a deck first."}
            </AppText>
            <AppButton
              title={submitting ? "Creating..." : "Create room"}
              variant="primary"
              disabled={submitting || !selectedDeckId}
              onPress={handleCreateRoom}
            />
          </AppCard>
          <AppCard className="gap-4">
            <AppText variant="subtitle">Join by code</AppText>
            <AppInput
              label="Room code"
              placeholder="MEM204"
              autoCapitalize="characters"
              value={joinCode}
              onChangeText={setJoinCode}
            />
            <AppButton
              title={submitting ? "Joining..." : "Join room"}
              disabled={submitting}
              onPress={handleJoinRoom}
            />
          </AppCard>
        </>
      )}
    </Screen>
  );
}
