import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";

export type Topic = Tables<"topics">;
export type TopicPage = {
  items: Topic[];
  hasMore: boolean;
  totalCount: number;
};

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function listTopics() {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function getTopic(topicId: string) {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("id", topicId)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function listTopicsPage({
  limit,
  offset,
}: {
  limit: number;
  offset: number;
}): Promise<TopicPage> {
  const start = offset;
  const end = offset + limit - 1;

  const { data, error, count } = await supabase
    .from("topics")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(start, end);

  if (error) throw error;

  const items = data ?? [];
  return {
    items,
    hasMore: items.length === limit,
    totalCount: count ?? 0,
  };
}

export async function listTopicDeckCounts(topicIds: string[]) {
  if (!topicIds.length) return new Map<string, number>();

  const userId = await getCurrentUserId();
  if (!userId) return new Map<string, number>();

  const { data, error } = await supabase
    .from("decks")
    .select("topic_id")
    .eq("owner_id", userId)
    .eq("is_archived", false)
    .in("topic_id", topicIds);

  if (error) throw error;

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    if (!row.topic_id) continue;
    counts.set(row.topic_id, (counts.get(row.topic_id) ?? 0) + 1);
  }

  return counts;
}

export async function createTopic(topic: Inserts<"topics">) {
  const { data, error } = await supabase
    .from("topics")
    .insert(topic)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateTopic(topicId: string, topic: Updates<"topics">) {
  const { data, error } = await supabase
    .from("topics")
    .update(topic)
    .eq("id", topicId)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteTopic(topicId: string) {
  const { error } = await supabase.from("topics").delete().eq("id", topicId);

  if (error) throw error;
}
