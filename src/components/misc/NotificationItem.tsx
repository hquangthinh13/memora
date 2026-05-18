import { TouchableOpacity, View } from "react-native";
import {
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";

import { AppButton } from "@/components/shared";
import { AppCard } from "@/components/shared";
import { AppText } from "@/components/shared";
import { colors } from "@/constants/theme";
import {
  parseNotificationMetadata,
  type Notification,
} from "@/services/notifications";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

type NotificationItemProps = {
  item: Notification;
  onPress: (item: Notification) => void;
  onMarkRead: (id: string) => void;
};

export function NotificationItem({
  item,
  onPress,
  onMarkRead,
}: NotificationItemProps) {
  const unread = !item.read_at;
  const metadata = parseNotificationMetadata(item.metadata);
  const hasDeckTarget = Boolean(metadata.deck_id);

  return (
    <TouchableOpacity onPress={() => onPress(item)}>
      <AppCard className="gap-3">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <AppText variant="caption" className="text-text-muted/70 text-xs">
              {formatDate(item.created_at)}
            </AppText>
            <View className="flex-row items-center gap-2">
              {unread ? (
                <View className="size-2 rounded-full bg-lavender" />
              ) : null}
              <AppText variant="subtitle" className="text-base">
                {item.title}
              </AppText>
            </View>
            {item.message ? (
              <AppText variant="caption" className="text-text-muted">
                {item.message}
              </AppText>
            ) : null}

            {unread ? (
              <View className="flex-row justify-start">
                <AppButton
                  title="Mark read"
                  variant="ghost"
                  icon={CheckmarkCircle01Icon}
                  iconColor={colors.mint}
                  layout="icon-leading"
                  className="h-9 min-h-9 rounded-full !px-0"
                  onPress={() => onMarkRead(item.id)}
                />
              </View>
            ) : null}
          </View>
          <View className="items-end gap-2">
            <HugeiconsIcon
              icon={hasDeckTarget ? ArrowRight01Icon : Notification03Icon}
              color={colors.textMuted}
            />
          </View>
        </View>
      </AppCard>
    </TouchableOpacity>
  );
}
