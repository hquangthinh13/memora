import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Image, Pressable, View } from "react-native";

import { cn } from "@/lib/cn";
import type { DeckSummary } from "@/services/decks";
import { AppText } from "./AppText";

type DeckCardProps = {
  deck: DeckSummary;
  href?: string;
  compact?: boolean;
  className?: string;
};

export function DeckCard({ deck, href, compact = false, className }: DeckCardProps) {
  const coverUrl = deck.cover_image_url ?? deck.cover_url;
  const content = (
    <Pressable
      className={cn(
        "gap-4 rounded-3xl border border-border bg-surface p-card active:opacity-80",
        compact && "flex-row items-center",
        className,
      )}
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          className={cn(
            "rounded-2xl bg-surface-soft",
            compact ? "size-20" : "h-36 w-full",
          )}
        />
      ) : (
        <View
          className={cn(
            "items-center justify-center rounded-2xl bg-peach-soft",
            compact ? "size-20" : "h-36 w-full",
          )}
        >
          <AppText variant="subtitle" className="text-center">
            {deck.title.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
      )}

      <View className="flex-1 gap-1">
        <AppText variant="subtitle" numberOfLines={2}>
          {deck.title}
        </AppText>
        <AppText variant="caption" numberOfLines={2}>
          {deck.description ?? "No description yet."}
        </AppText>
        <AppText variant="caption" className="font-sans-medium text-text">
          {deck.card_count} cards - {deck.collaborator_count} collaborators
        </AppText>
      </View>
    </Pressable>
  );

  if (!href) return content;

  return (
    <Link href={href as Href} asChild>
      {content}
    </Link>
  );
}
