import { supabase } from "@/lib/supabase";

export type CloudinaryFolder = "memora/deck" | "memora/user" | "memora/card";

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
};

type UploadImageToCloudinaryInput = {
  localUri: string;
  folder: CloudinaryFolder;
};

type DeleteCloudinaryImageInput = {
  deckId: string;
  publicId: string;
};

function getCloudinaryConfig() {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error("Missing EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME.");
  }

  if (!uploadPreset) {
    throw new Error("Missing EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.");
  }

  return { cloudName, uploadPreset };
}

function getFileName(localUri: string) {
  const fallback = `deck-cover-${Date.now()}.jpg`;
  return localUri.split("/").pop()?.split("?")[0] || fallback;
}

function getMimeType(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "heic" || extension === "heif") return "image/heic";

  return "image/jpeg";
}

export async function uploadImageToCloudinary({
  localUri,
  folder,
}: UploadImageToCloudinaryInput): Promise<CloudinaryUploadResult> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const fileName = getFileName(localUri);
  const formData = new FormData();

  formData.append("file", {
    uri: localUri,
    name: fileName,
    type: getMimeType(fileName),
  } as unknown as Blob);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof payload?.error?.message === "string"
        ? payload.error.message
        : "Cloudinary upload failed.";
    throw new Error(message);
  }

  if (typeof payload?.secure_url !== "string" || typeof payload?.public_id !== "string") {
    throw new Error("Cloudinary upload response was missing image details.");
  }

  return {
    secureUrl: payload.secure_url,
    publicId: payload.public_id,
  };
}

export async function deleteCloudinaryImage({
  deckId,
  publicId,
}: DeleteCloudinaryImageInput) {
  const { data, error } = await supabase.functions.invoke("delete-cloudinary-image", {
    body: { deckId, publicId },
  });

  if (error) {
    throw error;
  }

  return data as { success: boolean };
}

export async function safelyDeleteCloudinaryImage(input: DeleteCloudinaryImageInput) {
  try {
    await deleteCloudinaryImage(input);
    return null;
  } catch (error) {
    console.warn("Could not delete Cloudinary image.", error);
    return error instanceof Error ? error.message : "Could not delete old cover image.";
  }
}
