import { supabase } from "@/lib/supabase";
import type { Inserts, Tables, Updates } from "@/types/database";

export type Topic = Tables<"topics">;

export async function listTopics() {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
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
