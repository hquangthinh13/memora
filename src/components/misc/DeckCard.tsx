import type { Href } from "expo-router";
import { Link } from "expo-router";
import {
  BookOpen01Icon,
  HelpCircleIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Image, TouchableOpacity, View } from "react-native";

import { cn } from "@/lib/cn";
import type { CollaboratorPreviewProfile, DeckSummary } from "@/services/decks";
import { AppText } from "@/components/shared";
import { AvatarStack, MetaPill, PastelImageFallback } from "@/components/decks";

export type DeckCardData = {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  cover_url: string | null;
  status?: DeckSummary["status"];
  topics?: { name: string } | null;
  card_count: number;
  question_count?: number;
  collaborator_count: number;
  collaborators?: CollaboratorPreviewProfile[];
};

type DeckCardProps = {
  deck: DeckCardData | DeckSummary;
  href?: string;
  className?: string;
};

function toDeckCardData(deck: DeckCardData | DeckSummary): DeckCardData {
  const withDefaults = deck as Partial<DeckCardData>;

  return {
    id: deck.id,
    title: deck.title,
    description: deck.description ?? null,
    cover_image_url: deck.cover_image_url ?? null,
    cover_url: deck.cover_url ?? null,
    status: withDefaults.status,
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
  const shouldShowStatus =
    data.status === "Preparing" || data.status === "Failed";
  const statusClassName =
    data.status === "Failed"
      ? "border-danger/30 bg-pink-soft"
      : "border-peach/50 bg-peach-soft";

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
          <Image
            source={{ uri: coverUrl }}
            className="h-40 w-full bg-surface-soft"
          />
        ) : (
          <PastelImageFallback title={data.title} />
        )}
      </View>

      <View className="gap-3 p-card">
        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <AppText variant="subtitle" numberOfLines={2} className="flex-1">
              {data.title}
            </AppText>
            {shouldShowStatus ? (
              <View
                className={cn("rounded-lg border px-2 py-1", statusClassName)}
              >
                <AppText
                  variant="caption"
                  className="font-sans-semibold text-text"
                >
                  {data.status}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText
            variant="caption"
            className="text-text-muted"
            numberOfLines={2}
          >
            {data.description ?? "No description yet."}
          </AppText>
        </View>

        <View className="flex-row items-center justify-between gap-3">
          {data.topics?.name ? (
            <View className="self-start rounded-full bg-pink-soft border border-pink px-3 py-1">
              <AppText variant="caption" className="font-sans-medium text-text">
                {data.topics.name}
              </AppText>
            </View>
          ) : null}
          <View className="ml-auto flex-row flex-wrap items-center gap-2">
            <MetaPill icon={BookOpen01Icon} label={`${data.card_count}`} />
            {typeof data.question_count === "number" ? (
              <MetaPill
                icon={HelpCircleIcon}
                label={`${data.question_count}`}
              />
            ) : null}
            <MetaPill
              icon={UserGroupIcon}
              label={`${data.collaborator_count}`}
            />
          </View>

          <AvatarStack
            collaborators={data.collaborators ?? []}
            maxVisible={2}
          />
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
