import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ChatComposer({
  styles,
  theme,
  bottom,
  text,
  setText,
  replyMessage,
  currentUserId,
  onClearReply,
  selectedAttachment,
  onRemoveAttachment,
  attachmentMenuVisible,
  onToggleAttachmentMenu,
  onSend,
  sending,
  uploading,
}) {
  const busy = sending || uploading;

  return (
    <View style={[styles.composerContainer, { bottom }]}>
      {replyMessage && (
        <View style={styles.replyBar}>
          <View style={styles.replyIndicator} />

          <View style={styles.replyContent}>
            <Text style={styles.replyTitle}>
              {String(replyMessage.sender_id) === String(currentUserId)
                ? "You"
                : replyMessage.sender_name || "User"}
            </Text>

            <Text numberOfLines={1} style={styles.replyText}>
              {replyMessage.content}
            </Text>
          </View>

          <Pressable onPress={onClearReply} style={styles.closeReplyButton}>
            <Ionicons
              name="close-circle"
              size={27}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      )}

      {selectedAttachment && (
        <View style={styles.attachmentPreview}>
          {selectedAttachment.kind === "image" ? (
            <Image
              source={{ uri: selectedAttachment.uri }}
              style={styles.attachmentPreviewImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons
              name={
                selectedAttachment.kind === "video"
                  ? "videocam-outline"
                  : "document-outline"
              }
              size={30}
              color={theme.colors.primary}
            />
          )}

          <View style={styles.attachmentPreviewInfo}>
            <Text numberOfLines={1} style={styles.attachmentPreviewName}>
              {selectedAttachment.name}
            </Text>

            <Text style={styles.attachmentPreviewType}>
              {selectedAttachment.kind === "image"
                ? "Image"
                : selectedAttachment.kind === "video"
                  ? "Video"
                  : "Document"}
            </Text>
          </View>

          <Pressable
            onPress={onRemoveAttachment}
            style={styles.removeAttachmentButton}
            disabled={uploading}
          >
            <Ionicons
              name="close-circle"
              size={25}
              color={theme.colors.onSurfaceVariant}
            />
          </Pressable>
        </View>
      )}

      <View style={styles.inputContainer}>
        <Pressable style={styles.addButton} onPress={onToggleAttachmentMenu}>
          <Ionicons
            name={attachmentMenuVisible ? "close" : "add"}
            size={27}
            color={theme.colors.primary}
          />
        </Pressable>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          textAlignVertical="center"
          style={styles.textInput}
        />

        {text.trim().length === 0 && !selectedAttachment ? (
          <>
            <Pressable
              style={styles.inputIcon}
              onPress={() =>
                Alert.alert("Camera", "Camera will be added later.")
              }
            >
              <Ionicons
                name="camera-outline"
                size={27}
                color={theme.colors.primary}
              />
            </Pressable>

            <Pressable
              style={styles.inputIcon}
              onPress={() =>
                Alert.alert("Voice", "Voice recording will be added later.")
              }
            >
              <Ionicons
                name="mic-outline"
                size={27}
                color={theme.colors.primary}
              />
            </Pressable>
          </>
        ) : (
          <Pressable
            style={[
              styles.sendButton,
              sending && styles.sendButtonDisabled,
            ]}
            onPress={onSend}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.onPrimary}
              />
            ) : (
              <Ionicons
                name="send"
                size={22}
                color={theme.colors.onPrimary}
              />
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}
