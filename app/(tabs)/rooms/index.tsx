import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

import { AppButton, AppCard, AppInput, AppText, EmptyState, NavLink, Screen } from "@/components";
import { useAuth } from "@/hooks/useAuth";
import { useDecks } from "@/hooks/useDecks";
import { useRooms } from "@/hooks/useRooms";
import { createRoom, joinRoomByCode } from "@/services/rooms";

export default function RoomsScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { decks } = useDecks();
  const { rooms, loading, error } = useRooms();
  const [joinCode, setJoinCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const firstDeck = decks[0];

  async function handleCreateRoom() {
    if (!user || !firstDeck) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const room = await createRoom({
        deckId: firstDeck.id,
        hostId: user.id,
        nickname: profile?.display_name,
      });
      router.push(`/rooms/lobby?roomId=${room.id}&deckId=${firstDeck.id}`);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not create room.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinRoom() {
    if (!user || !joinCode.trim()) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const room = await joinRoomByCode({
        code: joinCode,
        userId: user.id,
        nickname: profile?.display_name,
      });
      router.push(`/rooms/lobby?roomId=${room.id}&deckId=${room.deck_id}`);
    } catch (caught) {
      setSubmitError(caught instanceof Error ? caught.message : "Could not join room.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll contentClassName="pb-32">
      <AppText variant="title">Rooms</AppText>
      <AppText variant="body" className="text-text-muted">
        Study live with friends by creating a room or joining one with a code.
      </AppText>

      {submitError ? <AppText variant="caption" className="text-danger">{submitError}</AppText> : null}
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

      <View className="gap-3">
        <AppCard className="gap-4 bg-mint-soft">
          <AppText variant="subtitle">Create a room</AppText>
          <AppText variant="caption">
            {firstDeck ? `Start with ${firstDeck.title}.` : "Create a deck before hosting a room."}
          </AppText>
          <AppButton
            title={submitting ? "Creating..." : "Create room"}
            disabled={submitting || !firstDeck}
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
            variant="secondary"
            disabled={submitting || !joinCode.trim()}
            onPress={handleJoinRoom}
          />
        </AppCard>
      </View>

      <View className="gap-4">
        <AppText variant="subtitle">Open rooms</AppText>
        {loading ? <AppText variant="caption">Loading rooms...</AppText> : null}
        {rooms.map((room) => (
          <AppCard key={room.id} className="gap-2 bg-surface-soft">
            <AppText variant="body" className="font-sans-semibold">
              {room.decks?.title ?? "Study room"}
            </AppText>
            <AppText variant="caption">
              Hosted by {room.users?.display_name ?? "a friend"} - code {room.code}
            </AppText>
            <NavLink href={`/rooms/lobby?roomId=${room.id}&deckId=${room.deck_id}`} title="Open lobby" />
          </AppCard>
        ))}
        {!loading && rooms.length === 0 ? (
          <EmptyState
            title="No open rooms"
            description="Joinable waiting rooms and rooms you joined will show up here."
          />
        ) : null}
      </View>
    </Screen>
  );
}
