import * as ImagePicker from "expo-image-picker";
import { Image, TouchableOpacity, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Camera01Icon } from "@hugeicons/core-free-icons";

import { AppButton } from "@/components/shared";
import { AppText } from "@/components/shared";

type AvatarPickerProps = {
  /** Current URI — may be a local file:// path or a remote https:// URL. */
  imageUri?: string | null;
  /** Fallback letter(s) shown when there is no image. */
  initials?: string;
  disabled?: boolean;
  onChange: (localUri: string) => void;
  onRemove?: () => void;
  onError: (message: string) => void;
};

export function AvatarPicker({
  imageUri,
  initials,
  disabled,
  onChange,
  onRemove,
  onError,
}: AvatarPickerProps) {
  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      onError("Allow photo library access to change your avatar.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
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

  const fallbackLetter = (initials ?? "?").slice(0, 1).toUpperCase();

  return (
    <View className="items-center gap-5">
      {/* Avatar circle — tapping it opens the picker */}
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={disabled}
        onPress={handlePickImage}
        className="relative"
      >
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            className="size-28 rounded-full bg-surface-soft"
            resizeMode="cover"
          />
        ) : (
          <View className="size-28 items-center justify-center rounded-full bg-lavender">
            <AppText variant="title" className="text-3xl">
              {fallbackLetter}
            </AppText>
          </View>
        )}

        {/* Camera badge */}
        <View className="absolute bottom-0 right-0 size-9 items-center justify-center rounded-full border-2 border-background bg-primary">
          <HugeiconsIcon
            icon={Camera01Icon}
            size={16}
            color="#ffffff"
            strokeWidth={2}
          />
        </View>
      </TouchableOpacity>

      {/* Action buttons */}
      <View className="flex-row gap-3">
        <AppButton
          title={imageUri ? "Change photo" : "Add photo"}
          variant="secondary"
          disabled={disabled}
          onPress={handlePickImage}
        />

        {imageUri && onRemove ? (
          <AppButton
            title="Remove photo"
            variant="ghost"
            disabled={disabled}
            onPress={onRemove}
          />
        ) : null}
      </View>
    </View>
  );
}


