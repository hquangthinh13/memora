import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getErrorMessage } from "@/lib/errors";
import { supabase } from "@/lib/supabase";
import {
  createRoom,
  createRoomQuestions,
  getRoomState,
  joinRoomByCode,
  submitRoomAnswer,
  updateRoom,
  type RoomState,
} from "@/services/rooms";
import type { Inserts } from "@/types/database";

export function useRoom(roomId?: string) {
  const channelInstanceId = useRef(
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
  );
  const [state, setState] = useState<RoomState>({
    room: null,
    players: [],
    questions: [],
    answers: [],
  });
  const [loading, setLoading] = useState(Boolean(roomId));
  const [error, setError] = useState<string | null>(null);

  const activeQuestion = useMemo(() => {
    const currentIndex = state.room?.current_question_index ?? 0;
    return state.questions.find((question) => question.index === currentIndex) ?? null;
  }, [state.questions, state.room?.current_question_index]);

  const refresh = useCallback(async () => {
    if (!roomId) return;

    setLoading(true);
    setError(null);

    try {
      setState(await getRoomState(roomId));
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not load room."));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!roomId) return;

    const topic = `room:${roomId}:${channelInstanceId.current}`;
    const channel = supabase
      .channel(topic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_questions", filter: `room_id=eq.${roomId}` },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_answers", filter: `room_id=eq.${roomId}` },
        () => void refresh(),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError("Could not subscribe to room updates.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, roomId]);

  return {
    ...state,
    activeQuestion,
    loading,
    error,
    refresh,
    createRoom,
    joinRoomByCode,
    createRoomQuestions,
    updateRoom,
    submitRoomAnswer,
  };
}

export type RoomQuestionInput = Inserts<"room_questions">;
