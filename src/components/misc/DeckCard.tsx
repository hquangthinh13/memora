import type { Href } from "expo-router";
import { Link } from "expo-router";
import {
  BookOpen01Icon,
  HelpCircleIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Image, TouchableOpacity, View } from "react-native";

import { cn } from "@/lib/cn";
import type { CollaboratorPreviewProfile, DeckSummary, PublishedDeckSummary } from "@/services/decks";
import { AppText } from "@/components/shared";
import {
  AvatarStack,
  MetaPill,
  PastelImageFallback,
  VisibilityBadge,
} from "@/components/decks";

export type DeckCardData = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cover_url: string | null;
  visibility: DeckSummary["visibility"];
  topics?: { name: string } | null;
  card_count: number;
  question_count?: number;
  collaborator_count: number;
  collaborators?: CollaboratorPreviewProfile[];
};

type DeckCardProps = {
  deck: DeckCardData | DeckSummary | PublishedDeckSummary;
  href?: string;
  className?: string;
};

function toDeckCardData(deck: DeckCardData | DeckSummary | PublishedDeckSummary): DeckCardData {
  const withDefaults = deck as Partial<DeckCardData>;

  return {
    id: deck.id,
    title: deck.title,
    description: deck.description ?? null,
    cover_image_url: deck.cover_image_url ?? null,
    cover_url: deck.cover_url ?? null,
    visibility: deck.visibility,
    topics: deck.topics,
    card_count: deck.card_count,
    question_count:
      typeof withDefaults.question_count === "number"
        ? withDefaults.question_count
        : undefined,
    collaborator_count:
      typeof withDefaults.collaborator_count === "number"
        ? withDefaults.collaborator_count
        : 0,
    collaborators: Array.isArray(withDefaults.collaborators)
      ? withDefaults.collaborators
      : [],
  };
}

export function DeckCard({ deck, href, className }: DeckCardProps) {
  const data = toDeckCardData(deck);
  const coverUrl = data.cover_image_url ?? data.cover_url;

  const content = (
    <TouchableOpacity
      accessibilityRole={href ? "link" : "button"}
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface shadow-sm active:opacity-85",
        className,
      )}
    >
      <View>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} className="h-40 w-full bg-surface-soft" />
        ) : (
          <PastelImageFallback title={data.title} />
        )}
      </View>

      <View className="gap-3 p-card">
        <View className="gap-1">
          <AppText variant="subtitle" numberOfLines={2}>
            {data.title}
          </AppText>
          <AppText variant="caption" className="text-text-muted" numberOfLines={2}>
            {data.description ?? "No description yet."}
          </AppText>
        </View>

        {data.topics?.name ? (
          <View className="self-start rounded-full bg-mint-soft px-3 py-1">
            <AppText variant="caption" className="font-sans-medium text-text">
              {data.topics.name}
            </AppText>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row flex-wrap items-center gap-2">
            <VisibilityBadge visibility={data.visibility} />
            <MetaPill icon={BookOpen01Icon} label={`${data.card_count}`} />
            {typeof data.question_count === "number" ? (
              <MetaPill icon={HelpCircleIcon} label={`${data.question_count}`} />
            ) : null}
            <MetaPill icon={UserGroupIcon} label={`${data.collaborator_count}`} />
          </View>

          <AvatarStack collaborators={data.collaborators ?? []} maxVisible={2} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!href) return content;

  return (
    <Link href={href as Href} asChild>
      {content}
    </Link>
  );
}


