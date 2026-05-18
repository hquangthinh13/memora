import { useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";

import { CreateTopicSheet, TopicPickerSheet } from "@/components/topics";
import { AppText } from "@/components/shared";
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

  const [pickerVisible, setPickerVisible] = useState(false);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === value) ?? null,
    [topics, value],
  );

  function openPicker() {
    setPickerVisible(true);
    void refresh();
  }

  function closePicker() {
    setPickerVisible(false);
  }

  function openCreateTopicSheet() {
    setPickerVisible(false);
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
        onPress={openPicker}
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

      <TopicPickerSheet
        visible={pickerVisible}
        topics={topics}
        value={value}
        loading={loading}
        onClose={closePicker}
        onSelect={onChange}
        onCreatePress={openCreateTopicSheet}
      />

      <CreateTopicSheet
        visible={createSheetVisible}
        onClose={() => setCreateSheetVisible(false)}
        onCreate={handleCreateTopic}
      />
    </View>
  );
}
