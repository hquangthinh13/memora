import { useCallback, useEffect, useMemo, useState } from "react";

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
      setError(caught instanceof Error ? caught.message : "Could not load room.");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`room:${roomId}`)
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
      .subscribe();

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
