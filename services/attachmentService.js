import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export async function pickMediaFromGallery() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images", "videos"],
    allowsMultipleSelection: false,
    quality: 1,
  });

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset) return null;

  const isVideo = asset.type === "video";

  return {
    uri: asset.uri,
    name:
      asset.fileName || (isVideo ? "video.mp4" : "image.jpg"),
    mimeType:
      asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg"),
    size: asset.fileSize || 0,
    kind: isVideo ? "video" : "image",
    file: asset.file || null,
  };
}

export async function pickDocumentFromDevice() {
  const result = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset) return null;

  return {
    uri: asset.uri,
    name: asset.name || "document",
    mimeType: asset.mimeType || "application/octet-stream",
    size: asset.size || 0,
    kind: "document",
    file: asset.file || null,
  };
}
