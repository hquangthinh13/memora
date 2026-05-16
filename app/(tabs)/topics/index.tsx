import { useEffect, useState } from "react";
import { View } from "react-native";

import {
  AppButton,
  AppCard,
  AppInput,
  AppText,
  ConfirmDialog,
  DraggableBottomSheet,
  EmptyState,
  Screen,
} from "@/components";
import { useTopics } from "@/hooks/useTopics";
import { getErrorMessage } from "@/lib/errors";
import type { Topic } from "@/services/topics";
import {
  Edit01Icon,
  Delete01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";

type TopicActionSheetProps = {
  topic: Topic | null;
  deleting: boolean;
  onClose: () => void;
  onEdit: (topic: Topic) => void;
  onDelete: (topic: Topic) => void;
};

function TopicActionSheet({
  topic,
  deleting,
  onClose,
  onEdit,
  onDelete,
}: TopicActionSheetProps) {
  return (
    <DraggableBottomSheet
      visible={Boolean(topic)}
      title={topic?.name ?? "Topic actions"}
      onClose={onClose}
    >
      {topic ? (
        <View className="gap-2">
          {topic.description ? (
            <AppText variant="caption" className="mb-2">
              {topic.description}
            </AppText>
          ) : null}
          <AppButton
            title="Edit Topic"
            icon={Edit01Icon}
            layout="icon-leading"
            variant="ghost"
            className="justify-start rounded-2xl bg-surface px-4"
            onPress={() => onEdit(topic)}
          />
          <View className="h-px bg-border" />
          <AppButton
            title={deleting ? "Deleting..." : "Delete Topic"}
            icon={Delete01Icon}
            layout="icon-leading"
            variant="destructive"
            className="justify-start rounded-2xl bg-surface px-4"
            disabled={deleting}
            onPress={() => onDelete(topic)}
          />
        </View>
      ) : null}
    </DraggableBottomSheet>
  );
}

export default function TopicsScreen() {
  const { topics, loading, error, addTopic, saveTopic, removeTopic } =
    useTopics();
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [pendingDeleteTopic, setPendingDeleteTopic] = useState<Topic | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingTopicId, setDeletingTopicId] = useState<string | null>(null);
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

  function handleEditFromSheet(topic: Topic) {
    setSelectedTopic(null);
    setEditingTopic(topic);
  }

  function confirmDeleteTopic(topic: Topic) {
    setPendingDeleteTopic(topic);
  }

  async function handleDelete(topic: Topic) {
    if (deletingTopicId) return;

    setDeletingTopicId(topic.id);
    setSubmitError(null);

    try {
      await removeTopic(topic.id);
      if (editingTopic?.id === topic.id) resetForm();
      setSelectedTopic(null);
      setPendingDeleteTopic(null);
    } catch (caught) {
      setSubmitError(getErrorMessage(caught, "Could not delete topic."));
    } finally {
      setDeletingTopicId(null);
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
        <AppInput
          label="Name"
          placeholder="Computer networks"
          value={name}
          onChangeText={setName}
        />
        <AppInput
          label="Description"
          placeholder="Optional notes about this topic"
          value={description}
          onChangeText={setDescription}
          multiline
          inputClassName="min-h-24 py-3"
          textAlignVertical="top"
        />
        {submitError ? (
          <AppText variant="caption" className="text-danger">
            {submitError}
          </AppText>
        ) : null}
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppButton
              title={
                submitting
                  ? "Saving..."
                  : editingTopic
                    ? "Save topic"
                    : "Create topic"
              }
              disabled={submitting}
              onPress={handleSave}
            />
          </View>
          {editingTopic ? (
            <View className="flex-1">
              <AppButton
                title="Cancel"
                variant="secondary"
                disabled={submitting}
                onPress={resetForm}
              />
            </View>
          ) : null}
        </View>
      </AppCard>

      {loading ? <AppText variant="caption">Loading topics...</AppText> : null}
      {error ? (
        <AppText variant="caption" className="text-danger">
          {error}
        </AppText>
      ) : null}

      <View className="gap-3">
        <AppText variant="subtitle">Your topics</AppText>
        {topics.map((topic) => (
          <AppCard key={topic.id}>
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
                title="Actions"
                layout="icon-only"
                icon={MoreHorizontalIcon}
                variant="ghost"
                className="h-10 min-h-10 w-10 rounded-full bg-surface-soft"
                disabled={submitting || Boolean(deletingTopicId)}
                onPress={() => setSelectedTopic(topic)}
              />
            </View>
          </AppCard>
        ))}
        {!loading && topics.length === 0 ? (
          <EmptyState
            title="No topics yet"
            description="Create a topic before generating your first AI deck."
          />
        ) : null}
      </View>

      <TopicActionSheet
        topic={selectedTopic}
        deleting={Boolean(selectedTopic && deletingTopicId === selectedTopic.id)}
        onClose={() => setSelectedTopic(null)}
        onEdit={handleEditFromSheet}
        onDelete={confirmDeleteTopic}
      />
      <ConfirmDialog
        visible={Boolean(pendingDeleteTopic)}
        title="Delete topic?"
        description="Are you sure you want to delete this topic? Related decks will keep their cards, but they may no longer be linked to this topic."
        confirmTitle="Delete"
        loading={Boolean(pendingDeleteTopic && deletingTopicId === pendingDeleteTopic.id)}
        onCancel={() => {
          if (!deletingTopicId) setPendingDeleteTopic(null);
        }}
        onConfirm={() => {
          if (pendingDeleteTopic) void handleDelete(pendingDeleteTopic);
        }}
      />
    </Screen>
  );
}
