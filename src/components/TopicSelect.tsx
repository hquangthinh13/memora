import { useMemo, useState } from "react";
import { Modal, TouchableOpacity, ScrollView, View } from "react-native";

import { useTopics } from "@/hooks/useTopics";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";
import { AppInput } from "./AppInput";
import { AppText } from "./AppText";
import { EmptyState } from "./EmptyState";

type TopicSelectProps = {
  value: string | null;
  onChange: (topicId: string) => void;
  disabled?: boolean;
  error?: string | null;
  label?: string;
};

export function TopicSelect({
  value,
  onChange,
  disabled,
  error,
  label = "Topic",
}: TopicSelectProps) {
  const { topics, loading, error: loadError, refresh, addTopic } = useTopics();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === value) ?? null,
    [topics, value],
  );

  function openDropdown() {
    setOpen(true);
    setAdding(false);
    setCreateError(null);
    void refresh();
  }

  function closeDropdown() {
    setOpen(false);
    setAdding(false);
    setCreateError(null);
    setName("");
    setDescription("");
  }

  async function handleCreateTopic() {
    if (!name.trim()) {
      setCreateError("Topic name is required.");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const created = await addTopic({
        name: name.trim(),
        description: description.trim() || null,
      });
      onChange(created.id);
      await refresh();
      closeDropdown();
    } catch (caught) {
      setCreateError(getErrorMessage(caught, "Could not create topic."));
    } finally {
      setCreating(false);
    }
  }

  return (
    <View className="gap-2">
      <AppText variant="caption" className="font-sans-medium text-text">
        {label}
      </AppText>
      <TouchableOpacity
        accessibilityRole="button"
        disabled={disabled}
        className={cn(
          "min-h-14 justify-center rounded-lg border bg-surface px-4 active:opacity-80",
          error ? "border-danger" : "border-border",
          disabled && "opacity-50",
        )}
        onPress={openDropdown}
      >
        <AppText
          variant="body"
          className={selectedTopic ? "text-text" : "text-text-soft"}
        >
          {selectedTopic?.name ??
            (loading ? "Loading topics..." : "Choose a topic")}
        </AppText>
        {selectedTopic?.description ? (
          <AppText variant="caption" numberOfLines={1}>
            {selectedTopic.description}
          </AppText>
        ) : null}
      </TouchableOpacity>
      {error ? (
        <AppText variant="caption" className="text-danger">
          {error}
        </AppText>
      ) : null}
      {loadError ? (
        <AppText variant="caption" className="text-danger">
          {loadError}
        </AppText>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <View className="flex-1 justify-end bg-black/30">
          <TouchableOpacity className="flex-1" onPress={closeDropdown} />
          <View className="max-h-[82%] rounded-t-3xl border border-border bg-background p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <AppText variant="subtitle">Choose topic</AppText>
                <AppText variant="caption">
                  Pick an existing topic or create a new one.
                </AppText>
              </View>
              <AppButton
                title="Close"
                variant="ghost"
                className="min-h-10 px-4"
                onPress={closeDropdown}
              />
            </View>

            {adding ? (
              <AppCard className="gap-4">
                <AppText variant="subtitle">Add new topic</AppText>
                <AppInput
                  label="Topic name"
                  placeholder="Computer networks"
                  value={name}
                  onChangeText={setName}
                />
                <AppInput
                  label="Description"
                  placeholder="Optional description"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  inputClassName="min-h-24 py-3"
                  textAlignVertical="top"
                />
                {createError ? (
                  <AppText variant="caption" className="text-danger">
                    {createError}
                  </AppText>
                ) : null}
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <AppButton
                      title="Cancel"
                      variant="secondary"
                      disabled={creating}
                      onPress={() => setAdding(false)}
                    />
                  </View>
                  <View className="flex-1">
                    <AppButton
                      title={creating ? "Creating..." : "Create"}
                      disabled={creating || !name.trim()}
                      onPress={() => void handleCreateTopic()}
                    />
                  </View>
                </View>
              </AppCard>
            ) : (
              <>
                <AppButton
                  title="Add new topic"
                  variant="secondary"
                  className="mb-4"
                  onPress={() => setAdding(true)}
                />
                {loading ? (
                  <AppText variant="caption">Loading topics...</AppText>
                ) : null}
                <ScrollView
                  className="max-h-96"
                  contentContainerClassName="gap-3 pb-4"
                >
                  {topics.map((topic) => (
                    <TouchableOpacity
                      key={topic.id}
                      accessibilityRole="button"
                      className={cn(
                        "rounded-3xl border p-card active:opacity-80",
                        topic.id === value
                          ? "border-primary bg-mint-soft"
                          : "border-border bg-surface",
                      )}
                      onPress={() => {
                        onChange(topic.id);
                        closeDropdown();
                      }}
                    >
                      <AppText variant="body" className="font-sans-semibold">
                        {topic.name}
                      </AppText>
                      {topic.description ? (
                        <AppText variant="caption" className="mt-1">
                          {topic.description}
                        </AppText>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                  {!loading && topics.length === 0 ? (
                    <EmptyState
                      title="No topics yet"
                      description="Create a topic to use it for this deck."
                    />
                  ) : null}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
