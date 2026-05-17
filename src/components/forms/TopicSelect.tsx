import { useMemo, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";

import { CreateTopicSheet } from "@/components/topics";
import { AppButton, AppText, EmptyState, LoadingState } from "@/components/shared";
import { useTopics } from "@/hooks/useTopics";
import { cn } from "@/lib/cn";

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
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === value) ?? null,
    [topics, value],
  );

  function openDropdown() {
    setOpen(true);
    void refresh();
  }

  function closeDropdown() {
    setOpen(false);
  }

  function openCreateTopicSheet() {
    setOpen(false);
    setCreateSheetVisible(true);
  }

  async function handleCreateTopic(values: {
    name: string;
    description: string | null;
  }) {
    const created = await addTopic(values);

    onChange(created.id);
    await refresh();
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
            <View className="mb-4 flex-row items-center justify-between gap-3">
              <View className="flex-1">
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

            <AppButton
              title="Add new topic"
              variant="secondary"
              className="mb-4"
              onPress={openCreateTopicSheet}
            />

            {loading ? (
              <LoadingState label="Loading topics..." center={false} size="sm" />
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
                    "rounded-lg border p-card active:opacity-80",
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
          </View>
        </View>
      </Modal>

      <CreateTopicSheet
        visible={createSheetVisible}
        onClose={() => setCreateSheetVisible(false)}
        onCreate={handleCreateTopic}
      />
    </View>
  );
}

