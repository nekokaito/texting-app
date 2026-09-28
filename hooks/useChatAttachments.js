import { Alert } from "react-native";
import {
  pickMediaFromGallery,
  pickDocumentFromDevice,
} from "../services/attachmentService";

export function useChatAttachments({
  onAttachmentSelected,
  onCloseMenu,
}) {
  const pickMedia = async () => {
    onCloseMenu();

    try {
      const attachment = await pickMediaFromGallery();
      if (attachment) {
        onAttachmentSelected(attachment);
      }
    } catch (err) {
      console.error("Media picker error:", err);
      Alert.alert(
        "Unable to open gallery",
        err.message || "Please try again.",
      );
    }
  };

  const pickDocument = async () => {
    onCloseMenu();

    try {
      const attachment = await pickDocumentFromDevice();
      if (attachment) {
        onAttachmentSelected(attachment);
      }
    } catch (err) {
      console.error("Document picker error:", err);
      Alert.alert(
        "Unable to open documents",
        err.message || "Please try again.",
      );
    }
  };

  return {
    pickMedia,
    pickDocument,
  };
}
