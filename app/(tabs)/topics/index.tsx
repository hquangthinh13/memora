import { useEffect, useState } from "react";
import { View } from "react-native";

import { AppButton, AppCard, AppInput, AppText, EmptyState, Screen } from "@/components";
import { useTopics } from "@/hooks/useTopics";
import { getErrorMessage } from "@/lib/errors";
import type { Topic } from "@/services/topics";

export default function TopicsScreen() {
  const { topics, loading, error, addTopic, saveTopic, removeTopic } = useTopics();
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingTopic) return;

    setName(editingTopic.name);
    setDescription(editingTopic.description ?? "");
  }, [editingTopic]);

  function resetForm() {
    setEditingTopic(null);
    setName("");
    setDescription("");
    setSubmitError(null);
  }

  async function handleSave() {
    if (!name.trim()) {
      setSubmitError("Topic name is required.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (editingTopic) {
        await saveTopic(editingTopic.id, {
          name: name.trim(),
          description: description.trim() || null,
        });
      } else {
        await addTopic({
          name: name.trim(),
          description: description.trim() || null,
        });
      }
      resetForm();
    } catch (caught) {
      setSubmitError(getErrorMessage(caught, "Could not save topic."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(topicId: string) {
    setSubmitting(true);
    setSubmitError(null);

    try {
      await removeTopic(topicId);
      if (editingTopic?.id === topicId) resetForm();
    } catch (caught) {
      setSubmitError(getErrorMessage(caught, "Could not delete topic."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll contentClassName="pb-32">
      <AppText variant="title">Topics</AppText>
      <AppText variant="body" className="text-text-muted">
        Organize generated decks by the subjects you are learning.
      </AppText>

      <AppCard className="gap-4">
        <AppText variant="subtitle">
          {editingTopic ? "Edit topic" : "Create topic"}
        </AppText>
        <AppInput label="Name" placeholder="Computer networks" value={name} onChangeText={setName} />
        <AppInput
          label="Description"
          placeholder="Optional notes about this topic"
          value={description}
          onChangeText={setDescription}
          multiline
          inputClassName="min-h-24 py-3"
          textAlignVertical="top"
        />
        {submitError ? <AppText variant="caption" className="text-danger">{submitError}</AppText> : null}
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppButton
              title={submitting ? "Saving..." : editingTopic ? "Save topic" : "Create topic"}
              disabled={submitting}
              onPress={handleSave}
            />
          </View>
          {editingTopic ? (
            <View className="flex-1">
              <AppButton title="Cancel" variant="secondary" disabled={submitting} onPress={resetForm} />
            </View>
          ) : null}
        </View>
      </AppCard>

      {loading ? <AppText variant="caption">Loading topics...</AppText> : null}
      {error ? <AppText variant="caption" className="text-danger">{error}</AppText> : null}

      <View className="gap-3">
        <AppText variant="subtitle">Your topics</AppText>
        {topics.map((topic) => (
          <AppCard key={topic.id} className="gap-3">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1 gap-1">
                <AppText variant="body" className="font-sans-semibold">
                  {topic.name}
                </AppText>
                <AppText variant="caption">
                  {topic.description ?? "No description yet."}
                </AppText>
              </View>
              <AppButton
                title="Edit"
                variant="secondary"
                className="min-h-10 px-4"
                disabled={submitting}
                onPress={() => setEditingTopic(topic)}
              />
            </View>
            <AppButton
              title="Delete topic"
              variant="ghost"
              disabled={submitting}
              onPress={() => void handleDelete(topic.id)}
            />
          </AppCard>
        ))}
        {!loading && topics.length === 0 ? (
          <EmptyState title="No topics yet" description="Create a topic before generating your first AI deck." />
        ) : null}
      </View>
    </Screen>
  );
}
