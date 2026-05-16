import * as ImagePicker from "expo-image-picker";
import { Image, View } from "react-native";

import { cn } from "@/lib/cn";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";

type DeckCoverPickerProps = {
  imageUri?: string | null;
  disabled?: boolean;
  onChange: (localUri: string) => void;
  onRemove?: () => void;
  onError: (message: string) => void;
  className?: string;
};

export function DeckCoverPicker({
  imageUri,
  disabled,
  onChange,
  onRemove,
  onError,
  className,
}: DeckCoverPickerProps) {
  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      onError("Allow photo library access to choose a cover image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (!asset?.uri) {
      onError("Could not read the selected image.");
      return;
    }

    if (asset.type && asset.type !== "image") {
      onError("Please choose an image file.");
      return;
    }

    onChange(asset.uri);
  }

  return (
    <View className={cn("gap-3", className)}>
      <View className="h-48 w-full overflow-hidden rounded-lg border border-border bg-surface-soft">
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center px-6">
            <AppText variant="subtitle" className="text-center">
              No cover image
            </AppText>
            <AppText variant="caption" className="mt-2 text-center">
              Choose a soft visual for this deck.
            </AppText>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <AppButton
            title={imageUri ? "Change cover" : "Upload cover"}
            variant="ghost"
            disabled={disabled}
            onPress={handlePickImage}
          />
        </View>
        {imageUri && onRemove ? (
          <View className="flex-1">
            <AppButton
              title="Remove"
              variant="ghost"
              disabled={disabled}
              onPress={onRemove}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
