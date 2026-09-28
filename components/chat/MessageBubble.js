import { Ionicons } from "@expo/vector-icons";
import { Alert, Image, Linking, Pressable, Text, View } from "react-native";
import { formatMessageTime } from "../../utils/messageUtils";

export default function MessageBubble({
  message,
  currentUserId,
  theme,
  styles,
  onLongPress,
  isLastMessage,
}) {
  const isMine =
    currentUserId != null &&
    String(message.sender_id) === String(currentUserId);

  const statusLabels = {
    SENT: "Sent",
    DELIVERED: "Delivered",
    SEEN: "Seen",
  };

  const messageStatus = String(
    message.message_status ??
      message.status ??
      message.MESSAGE_STATUS ??
      "SENT",
  ).toUpperCase();

  const attachments = Array.isArray(message.attachments)
    ? message.attachments
    : [];

  const openAttachment = (url) => {
    Linking.openURL(String(url)).catch(() =>
      Alert.alert("Unable to open file", "Please try again."),
    );
  };

  return (
    <View
      style={[
        styles.messageRow,
        isMine ? styles.myMessageRow : styles.otherMessageRow,
      ]}
    >
      <Pressable onLongPress={() => onLongPress(message)} delayLongPress={300}>
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.otherBubble,
          ]}
        >
          {!isMine && (
            <Text style={styles.senderName}>
              {message.sender_name || "User"}
            </Text>
          )}

          {attachments.map((attachment, index) => {
            if (!attachment || typeof attachment !== "object") {
              return null;
            }

            const url =
              attachment.URL ??
              attachment.url ??
              attachment.FILE_PATH ??
              attachment.filePath ??
              null;

            const fileName =
              attachment.FILE_NAME ?? attachment.fileName ?? "Attachment";

            const fileType = String(
              attachment.FILE_TYPE ?? attachment.fileType ?? "",
            ).toLowerCase();

            const isImage = fileType.startsWith("image/");
            const isVideo = fileType.startsWith("video/");

            if (!url) return null;

            return (
              <Pressable
                key={
                  attachment.ATTACHMENT_ID ??
                  attachment.attachment_id ??
                  `${message.message_id}-${index}`
                }
                onPress={() => openAttachment(url)}
                style={styles.chatAttachment}
              >
                {isImage ? (
                  <Image
                    source={{ uri: String(url) }}
                    style={styles.chatAttachmentImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.chatAttachmentFile}>
                    <Ionicons
                      name={isVideo ? "videocam-outline" : "document-outline"}
                      size={28}
                      color={theme.colors.primary}
                    />

                    <Text
                      numberOfLines={2}
                      style={styles.chatAttachmentFileName}
                    >
                      {String(fileName)}
                    </Text>

                    <Ionicons
                      name="download-outline"
                      size={20}
                      color={theme.colors.primary}
                    />
                  </View>
                )}
              </Pressable>
            );
          })}

          <View style={styles.messageContentRow}>
            <Text
              style={[
                styles.messageText,
                isMine ? styles.myMessageText : styles.otherMessageText,
              ]}
            >
              {message.content}
            </Text>

            <Text
              style={[
                styles.messageTime,
                isMine ? styles.myMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatMessageTime(message.created_at)}
            </Text>
          </View>
        </View>
      </Pressable>

      {isMine && isLastMessage && (
        <Text style={styles.messageStatusText}>
          {statusLabels[messageStatus] || "Sent"}
        </Text>
      )}
    </View>
  );
}
