import { Modal, Pressable, View } from "react-native";

import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmTitle?: string;
  cancelTitle?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmTitle = "Delete",
  cancelTitle = "Cancel",
  loading,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-center bg-black/30 px-5">
        <Pressable className="absolute inset-0" disabled={loading} onPress={onCancel} />
        <AppCard className="gap-4">
          <View className="gap-2">
            <AppText variant="subtitle">{title}</AppText>
            <AppText variant="body" className="text-text-muted">
              {description}
            </AppText>
          </View>
          <View className="flex-row gap-2">
            <View className="flex-1">
              <AppButton title={cancelTitle} variant="secondary" disabled={loading} onPress={onCancel} />
            </View>
            <View className="flex-1">
              <AppButton
                title={loading ? "Deleting..." : confirmTitle}
                variant="destructive"
                disabled={loading}
                onPress={onConfirm}
              />
            </View>
          </View>
        </AppCard>
      </View>
    </Modal>
  );
}
