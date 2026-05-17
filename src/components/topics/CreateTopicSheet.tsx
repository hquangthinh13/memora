import { useState } from "react";
import { View } from "react-native";

import {
  AppButton,
  AppInput,
  AppText,
  DraggableBottomSheet,
} from "@/components/shared";
import { getErrorMessage } from "@/lib/errors";

type CreateTopicSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (values: { name: string; description: string | null }) => Promise<void>;
};

export function CreateTopicSheet({ visible, onClose, onCreate }: CreateTopicSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Topic name is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onCreate({
        name: name.trim(),
        description: description.trim() || null,
      });
      setName("");
      setDescription("");
      onClose();
    } catch (caught) {
      setError(getErrorMessage(caught, "Could not create topic."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DraggableBottomSheet visible={visible} title="Create topic" onClose={onClose}>
      <View className="gap-4">
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
        {error ? (
          <AppText variant="caption" className="text-danger">
            {error}
          </AppText>
        ) : null}
        <View className="flex-row gap-2">
          <View className="flex-1">
            <AppButton
              title="Cancel"
              variant="secondary"
              disabled={submitting}
              onPress={onClose}
            />
          </View>
          <View className="flex-1">
            <AppButton
              title={submitting ? "Creating..." : "Create"}
              disabled={submitting}
              onPress={() => {
                void handleSubmit();
              }}
            />
          </View>
        </View>
      </View>
    </DraggableBottomSheet>
  );
}

