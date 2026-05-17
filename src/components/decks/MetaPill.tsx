import { HugeiconsIcon, type HugeiconsProps } from "@hugeicons/react-native";
import { View } from "react-native";

import { AppText } from "@/components/shared";

type MetaPillProps = {
  icon: HugeiconsProps["icon"];
  label: string;
};

export function MetaPill({ icon, label }: MetaPillProps) {
  return (
    <View className="flex-row items-center gap-1 px-0 py-0">
      <HugeiconsIcon icon={icon} size={13} color="#706A68" />
      <AppText variant="caption" className="font-sans-medium text-text-muted">
        {label}
      </AppText>
    </View>
  );
}


