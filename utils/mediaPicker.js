import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export const pickImageOrVideo = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Media library permission is required");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsEditing: false,
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    fileName: asset.fileName || `media-${Date.now()}`,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    type: asset.type,
  };
};

export const pickDocument = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    file: asset.file ?? null,
    fileName: asset.name,
    mimeType: asset.mimeType || "application/octet-stream",
    fileSize: asset.size || 0,
    type: "document",
  };
};
