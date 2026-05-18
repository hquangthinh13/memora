import { ScrollView, TouchableOpacity, View } from "react-native";

import {
  AppButton,
  AppText,
  DraggableBottomSheet,
  EmptyState,
  LoadingState,
} from "@/components/shared";
import { cn } from "@/lib/cn";

type Topic = {
  id: string;
  name: string;
  description: string | null;
};

type TopicPickerSheetProps = {
  visible: boolean;
  topics: Topic[];
  value: string | null;
  loading?: boolean;
  onClose: () => void;
  onSelect: (topicId: string) => void;
  onCreatePress: () => void;
};

export function TopicPickerSheet({
  visible,
  topics,
  value,
  loading,
  onClose,
  onSelect,
  onCreatePress,
}: TopicPickerSheetProps) {
  return (
    <DraggableBottomSheet
      visible={visible}
      title="Choose topic"
      onClose={onClose}
    >
      <View className="gap-4">
        <AppText variant="caption">
          Pick an existing topic or create a new one.
        </AppText>

        <AppButton
          title="Add new topic"
          variant="secondary"
          onPress={onCreatePress}
        />

        {loading ? (
          <LoadingState label="Loading topics..." center={false} size="sm" />
        ) : null}

        <ScrollView
          className="max-h-96"
          contentContainerClassName="gap-3 pb-2"
          showsVerticalScrollIndicator={false}
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
                onSelect(topic.id);
                onClose();
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
    </DraggableBottomSheet>
  );
}
