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

export function DeckCard({
  deck,
  href,
  compact = false,
  className,
}: DeckCardProps) {
  const coverUrl = deck.cover_image_url ?? deck.cover_url;
  const content = (
    <Pressable
      className={cn(
        "rounded-lg border border-border bg-surface active:opacity-80 overflow-hidden",
        compact && "gap-2 flex-row items-center",
        className,
      )}
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          className={cn(
            "bg-surface-soft",
            compact ? "size-24 rounded-xs ml-5" : "h-40 w-full",
          )}
        />
      ) : (
        <View
          className={cn(
            " items-center justify-center rounded-2xl bg-peach-soft",
            compact ? "size-20" : "h-40 w-full",
          )}
        >
          <AppText variant="subtitle" className="text-center">
            {deck.title.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
      )}
      <View className={cn("flex-1 gap-1 p-card", compact ? "" : "pt-4")}>
        <AppText variant="subtitle" numberOfLines={2}>
          {deck.title}
        </AppText>
        <AppText variant="caption" numberOfLines={2}>
          {deck.description ?? "No description yet."}
        </AppText>

        <AppText variant="caption" className="font-sans-medium text-text">
          {deck.card_count} cards - {deck.question_count} questions
        </AppText>
        <View className="flex-row flex-wrap items-center gap-2 mt-3">
          <View className="rounded-full border border-border bg-surface-soft px-3 py-1">
            <AppText variant="caption" className="font-sans-semibold text-text">
              {deck.status}
            </AppText>
          </View>
          {deck.topics?.name ? (
            <View className="rounded-full bg-mint-soft px-3 py-1">
              <AppText variant="caption" className="font-sans-medium text-text">
                {deck.topics.name}
              </AppText>
            </View>
          ) : null}
        </View>
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
