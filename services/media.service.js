import * as FileSystem from "expo-file-system/legacy";
import { Platform } from "react-native";
import { API_URL } from "../constants/API";

export const getUploadSignature = async () => {
  const response = await fetch(`${API_URL}/api/media/signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to get upload signature");
  }

  return data;
};

export const uploadDocumentToCloudinary = async (file) => {
  try {
    // 1. Get the signed upload details
    const signatureData = await getUploadSignature();

    console.log("Upload signature received");

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`;

    let result;

    // 2. WEB upload
    if (Platform.OS === "web") {
      let documentBlob;

      // Prefer the actual browser File/Blob object if available
      if (file.file instanceof Blob) {
        documentBlob = file.file;
      } else {
        // Otherwise, read the browser's blob URI
        const blobResponse = await fetch(file.uri);

        if (!blobResponse.ok) {
          throw new Error("Could not read the selected document");
        }

        documentBlob = await blobResponse.blob();
      }

      const formData = new FormData();

      formData.append("file", documentBlob, file.fileName || "document");

      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", String(signatureData.timestamp));
      formData.append("folder", signatureData.folder);
      formData.append("signature", signatureData.signature);

      const response = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      result = {
        status: response.status,
        body: await response.text(),
      };
    } else {
      // 3. ANDROID / IOS upload
      const uploadUri = file.uri;

      result = await FileSystem.uploadAsync(cloudinaryUrl, uploadUri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        mimeType: file.mimeType || "application/octet-stream",
        parameters: {
          api_key: signatureData.apiKey,
          timestamp: String(signatureData.timestamp),
          folder: signatureData.folder,
          signature: signatureData.signature,
        },
      });
    }

    // 4. Parse Cloudinary's response
    const data = JSON.parse(result.body);

    console.log("Cloudinary response:", data);

    if (result.status < 200 || result.status >= 300) {
      throw new Error(data.error?.message || "Cloudinary upload failed");
    }

    // 5. Return uploaded file metadata
    return {
      url: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type,
      format: data.format,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
    };
  } catch (error) {
    console.error("Upload service error:", error);
    throw error;
  }
};

// Preserve compatibility with your existing test screen
export const uploadToCloudinary = uploadDocumentToCloudinary;
