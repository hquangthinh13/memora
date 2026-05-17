import { useEffect } from "react";
import { Modal, Platform, TouchableOpacity, View } from "react-native";

import { cn } from "@/lib/cn";
import { useOverlayState } from "@/providers/OverlayProvider";
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
  cardClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;

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
  cardClassName,
  titleClassName,
  descriptionClassName,

  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const { openOverlay, closeOverlay } = useOverlayState();

  useEffect(() => {
    if (!visible) return;
    openOverlay();

    return () => {
      closeOverlay();
    };
  }, [closeOverlay, openOverlay, visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent={Platform.OS === "android"}
      onRequestClose={onCancel}
    >
      <View className="flex-1 justify-center bg-black/30 px-5">
        <TouchableOpacity
          className="absolute inset-0"
          disabled={loading}
          onPress={onCancel}
        />

        <AppCard className={cn("gap-5 rounded-lg", cardClassName)}>
          <View className="gap-2">
            <AppText variant="subtitle" className={titleClassName}>
              {title}
            </AppText>

            {description ? (
              <AppText
                variant="body"
                className={cn("text-text-muted", descriptionClassName)}
              >
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
