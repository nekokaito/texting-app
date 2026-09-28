import { Platform } from "react-native";
import { File } from "expo-file-system";
import { API_URL } from "../constants/API";

export async function uploadToCloudinary(attachment, token) {
  const signatureResponse = await fetch(
    `${API_URL}/api/media/signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  const signatureData = await signatureResponse.json();

  if (!signatureResponse.ok || !signatureData.success) {
    throw new Error(
      signatureData.message ||
        "Could not get Cloudinary upload signature",
    );
  }

  const formData = new FormData();

  if (Platform.OS === "web") {
    let webFile = attachment.file;

    if (!webFile) {
      const fileResponse = await fetch(attachment.uri);
      const blob = await fileResponse.blob();

      webFile = new globalThis.File(
        [blob],
        attachment.name || "attachment",
        {
          type:
            attachment.mimeType || "application/octet-stream",
        },
      );
    }

    formData.append("file", webFile);
  } else {
    const nativeFile = new File(attachment.uri);
    formData.append("file", nativeFile);
  }

  formData.append("api_key", String(signatureData.apiKey));
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("folder", signatureData.folder);
  formData.append("signature", signatureData.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  const uploadData = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadData.secure_url) {
    throw new Error(
      uploadData.error?.message || "Cloudinary upload failed",
    );
  }

  return uploadData;
}
