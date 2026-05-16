import { Modal, TouchableOpacity, View } from "react-native";

import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";
import { AppText } from "./AppText";

type ConfirmDialogProps = {
  visible: boolean;

  title: string;
  description?: string;

  confirmTitle?: string;
  cancelTitle?: string;
  loadingTitle?: string;

  confirmVariant?: "primary" | "secondary" | "ghost" | "destructive";

  hideCancel?: boolean;
  loading?: boolean;

  children?: React.ReactNode;

  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,

  title,
  description,

  confirmTitle = "Confirm",
  cancelTitle = "Cancel",
  loadingTitle = "Loading...",

  confirmVariant = "primary",

  hideCancel = false,
  loading = false,

  children,

  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center bg-black/30 px-5">
        <TouchableOpacity
          className="absolute inset-0"
          disabled={loading}
          onPress={onCancel}
        />

        <AppCard className="gap-5 rounded-3xl">
          <View className="gap-2">
            <AppText variant="subtitle">{title}</AppText>

            {description ? (
              <AppText variant="body" className="text-text-muted">
                {description}
              </AppText>
            ) : null}

            {children}
          </View>

          <View className="flex-row gap-2">
            {!hideCancel ? (
              <View className="flex-1">
                <AppButton
                  title={cancelTitle}
                  variant="secondary"
                  disabled={loading}
                  onPress={onCancel}
                />
              </View>
            ) : null}

            <View className="flex-1">
              <AppButton
                title={loading ? loadingTitle : confirmTitle}
                variant={confirmVariant}
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
