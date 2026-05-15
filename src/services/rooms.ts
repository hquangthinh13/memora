import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";

export type Room = Tables<"rooms">;
export type RoomPlayer = Tables<"room_players">;
export type RoomQuestion = Tables<"room_questions">;
export type RoomAnswer = Tables<"room_answers">;
export type OpenRoom = Room & {
  decks?: Pick<Tables<"decks">, "id" | "title" | "cover_image_url" | "cover_url"> | null;
  users?: Pick<Tables<"users">, "id" | "display_name" | "avatar_url"> | null;
};

export type RoomState = {
  room: Room | null;
  players: RoomPlayer[];
  questions: RoomQuestion[];
  answers: RoomAnswer[];
};

function makeRoomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createRoom({
  deckId,
  hostId,
  nickname,
}: {
  deckId: string;
  hostId: string;
  nickname?: string | null;
}) {
  const { data: room, error } = await supabase
    .from("rooms")
    .insert({
      deck_id: deckId,
      host_id: hostId,
      code: makeRoomCode(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await joinRoom({
    roomId: room.id,
    userId: hostId,
    nickname,
  });

  return room;
}

export async function joinRoom({
  roomId,
  userId,
  nickname,
}: {
  roomId: string;
  userId: string;
  nickname?: string | null;
}) {
  const { data, error } = await supabase
    .from("room_players")
    .upsert(
      {
        room_id: roomId,
        user_id: userId,
        nickname,
        left_at: null,
      },
      { onConflict: "room_id,user_id" },
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function joinRoomByCode({
  code,
  userId,
  nickname,
}: {
  code: string;
  userId: string;
  nickname?: string | null;
}) {
  const { data: room, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!room) {
    throw new Error("No room found for that code.");
  }

  await joinRoom({ roomId: room.id, userId, nickname });

  return room;
}

export async function getRoomState(roomId: string): Promise<RoomState> {
  const [roomResult, playersResult, questionsResult, answersResult] =
    await Promise.all([
      supabase.from("rooms").select("*").eq("id", roomId).maybeSingle(),
      supabase.from("room_players").select("*").eq("room_id", roomId).order("score", { ascending: false }),
      supabase.from("room_questions").select("*").eq("room_id", roomId).order("index", { ascending: true }),
      supabase.from("room_answers").select("*").eq("room_id", roomId),
    ]);

  if (roomResult.error) throw roomResult.error;
  if (playersResult.error) throw playersResult.error;
  if (questionsResult.error) throw questionsResult.error;
  if (answersResult.error) throw answersResult.error;

  return {
    room: roomResult.data,
    players: playersResult.data,
    questions: questionsResult.data,
    answers: answersResult.data,
  };
}

export async function updateRoom(roomId: string, room: Updates<"rooms">) {
  const { data, error } = await supabase
    .from("rooms")
    .update(room)
    .eq("id", roomId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createRoomQuestions(questions: Inserts<"room_questions">[]) {
  const { data, error } = await supabase
    .from("room_questions")
    .insert(questions)
    .select();

  if (error) {
    throw error;
  }

  return data;
}

export async function submitRoomAnswer(answer: Inserts<"room_answers">) {
  const { data: existingAnswer, error: existingAnswerError } = await supabase
    .from("room_answers")
    .select("*")
    .eq("question_id", answer.question_id)
    .eq("user_id", answer.user_id)
    .maybeSingle();

  if (existingAnswerError) {
    throw existingAnswerError;
  }

  const answerResult = existingAnswer
    ? await supabase
        .from("room_answers")
        .update(answer)
        .eq("id", existingAnswer.id)
        .select()
        .single()
    : await supabase
        .from("room_answers")
        .insert(answer)
        .select()
        .single();

  if (answerResult.error) {
    throw answerResult.error;
  }

  const scoreDelta = (answer.score ?? 0) - (existingAnswer?.score ?? 0);

  if (scoreDelta !== 0) {
    const { data: player, error: playerError } = await supabase
      .from("room_players")
      .select("*")
      .eq("room_id", answer.room_id)
      .eq("user_id", answer.user_id)
      .maybeSingle();

    if (playerError) {
      throw playerError;
    }

    const { error: scoreError } = await supabase
      .from("room_players")
      .update({ score: (player?.score ?? 0) + scoreDelta })
      .eq("room_id", answer.room_id)
      .eq("user_id", answer.user_id);

    if (scoreError) {
      throw scoreError;
    }
  }

  return answerResult.data;
}

export async function listOpenRooms() {
  const { data, error } = await supabase
    .from("rooms")
    .select("*, decks(id, title, cover_image_url, cover_url), users!rooms_host_id_fkey(id, display_name, avatar_url)")
    .eq("status", "WAITING")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as OpenRoom[];
}
