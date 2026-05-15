import { useLocalSearchParams } from "expo-router";

import { AppCard, AppText, NavLink, PlaceholderList, Screen } from "@/components";
import { useRoom } from "@/hooks/useRoom";

export default function RoomResultScreen() {
  const { roomId } = useLocalSearchParams<{ roomId?: string }>();
  const room = useRoom(roomId);

  return (
    <Screen scroll>
      <AppCard className="bg-lavender">
        <AppText variant="title">Room results</AppText>
        <AppText variant="body" className="mt-3 text-text-muted">
          Scores update from room participant rows.
        </AppText>
      </AppCard>

      {room.loading ? <AppText variant="caption">Loading results...</AppText> : null}
      {room.error ? <AppText variant="caption" className="text-danger">{room.error}</AppText> : null}

      <PlaceholderList
        items={room.players.map((player) => ({
          title: player.nickname ?? "Learner",
          description: `${player.score} points`,
          tone: "bg-surface",
        }))}
      />

      {room.room ? <NavLink href={`/rooms/lobby?roomId=${room.room.id}`} title="Play again" variant="primary" /> : null}
      <NavLink href="/(tabs)" title="Back home" />
    </Screen>
  );
}
