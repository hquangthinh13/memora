import { AppCard, AppText } from "@/components/shared";
import type { TopicListItem } from "@/hooks/usePaginatedTopics";

type TopicCardProps = {
  topic: TopicListItem;
};

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <AppCard className="mr-3 w-64 gap-2">
      <AppText variant="body" className="font-sans-semibold" numberOfLines={1}>
        {topic.name}
      </AppText>
      {topic.description ? (
        <AppText variant="caption" className="text-text-muted" numberOfLines={2}>
          {topic.description}
        </AppText>
      ) : (
        <AppText variant="caption" className="text-text-muted">
          No description
        </AppText>
      )}
      {typeof topic.deck_count === "number" ? (
        <AppText variant="caption" className="text-text-muted">
          {topic.deck_count} {topic.deck_count === 1 ? "deck" : "decks"}
        </AppText>
      ) : null}
    </AppCard>
  );
}

