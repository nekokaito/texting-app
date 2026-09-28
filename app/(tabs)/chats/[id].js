import { Ionicons } from "@expo/vector-icons";

import * as DocumentPicker from "expo-document-picker";

import * as ImagePicker from "expo-image-picker";

import { File } from "expo-file-system";

import { Stack, useLocalSearchParams, useRouter } from "expo-router";

import * as SecureStore from "expo-secure-store";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "react-native-paper";

import { API_URL } from "../../../constants/API";

const SESSION_KEY = "user_session";

async function uploadToCloudinary(attachment, token) {
  // 1. Request a signed upload from your backend

  const signatureResponse = await fetch(`${API_URL}/api/media/signature`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${token}`,

      Accept: "application/json",

      "Content-Type": "application/json",
    },

    body: JSON.stringify({}),
  });

  const signatureData = await signatureResponse.json();

  if (!signatureResponse.ok || !signatureData.success) {
    throw new Error(
      signatureData.message || "Could not get Cloudinary upload signature",
    );
  }

  // 2. Prepare the file for upload

  const formData = new FormData();

  if (Platform.OS === "web") {
    // Browser upload: use the browser File object when available.

    let webFile = attachment.file;

    // If the picker didn't provide a File object, create one from its URI.

    if (!webFile) {
      const fileResponse = await fetch(attachment.uri);

      const blob = await fileResponse.blob();

      webFile = new globalThis.File([blob], attachment.name || "attachment", {
        type: attachment.mimeType || "application/octet-stream",
      });
    }

    formData.append("file", webFile);
  } else {
    // Native upload: use Expo's File object rather than a plain { uri } object.

    const nativeFile = new File(attachment.uri);

    formData.append("file", nativeFile);
  }

  formData.append("api_key", String(signatureData.apiKey));

  formData.append("timestamp", String(signatureData.timestamp));

  formData.append("folder", signatureData.folder);

  formData.append("signature", signatureData.signature);

  // 3. Upload directly to Cloudinary

  const uploadResponse = await fetch(
    `https\://api.cloudinary.com/v1_1/${signatureData.cloudName}/auto/upload`,

    {
      method: "POST",

      body: formData,
    },
  );

  const uploadData = await uploadResponse.json();

  if (!uploadResponse.ok || !uploadData.secure_url) {
    throw new Error(uploadData.error?.message || "Cloudinary upload failed");
  }

  // 4. Return the uploaded file information

  return uploadData;
}

function ChatHeader({ chat, loading, styles }) {
  if (loading) {
    return <Text style={styles.headerLoading}>Loading...</Text>;
  }

  const displayName =
    chat?.DISPLAY_NAME ||
    chat?.OTHER_FULL_NAME ||
    chat?.OTHER_USERNAME ||
    chat?.TITLE ||
    "Chat";

  const isOnline = chat?.OTHER_IS_ONLINE === "Y";

  const picture = chat?.OTHER_PROFILE_PICTURE;

  return (
    <View color style={styles.headerContainer}>
      <View style={styles.headerAvatar}>
        {picture ? (
          <ImageBackground
            source={{ uri: picture }}
            style={styles.headerAvatarImage}
            imageStyle={styles.headerAvatarImageStyle}
          />
        ) : (
          <Text style={styles.headerAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.headerTextContainer}>
        <Text numberOfLines={1} style={styles.headerName}>
          {displayName}
        </Text>

        <Text style={styles.headerStatus}>
          {isOnline ? "Online" : "Offline"}
        </Text>
      </View>
    </View>
  );
}

export default function ChatPage() {
  const { id } = useLocalSearchParams();

  const router = useRouter();

  // Pulls colors from whatever theme (light/dark) the app's PaperProvider

  // is currently using, so this whole screen follows the system theme.

  const theme = useTheme();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const chatId = Array.isArray(id) ? id[0] : id;

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [replyMessage, setReplyMessage] = useState(null);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const [token, setToken] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");

  const [chatInfo, setChatInfo] = useState(null);

  const [chatInfoLoading, setChatInfoLoading] = useState(true);

  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);

  const [selectedAttachment, setSelectedAttachment] = useState(null);

  const [uploading, setUploading] = useState(false);

  const flatListRef = useRef(null);

  useEffect(() => {
    console.log("Chat screen route ID:", chatId);
  }, [chatId]);

  const normalizeMessage = (message = {}) => {
    const rawAttachments =
      message.MESSAGE_ATTACHMENTS ??
      message.ATTACHMENTS ??
      message.attachments ??
      [];

    return {
      message_id: message.MESSAGE_ID ?? message.message_id ?? null,
      chat_id: message.CHAT_ID ?? message.chat_id ?? null,
      sender_id: message.SENDER_ID ?? message.sender_id ?? null,
      sender_name:
        message.SENDER_FULL_NAME ??
        message.FULL_NAME ??
        message.SENDER_USERNAME ??
        message.USERNAME ??
        message.sender_name ??
        "User",
      content: message.MESSAGE_TEXT ?? message.content ?? "",
      message_type: message.MESSAGE_TYPE ?? message.message_type ?? "TEXT",
      created_at: message.SENT_AT ?? message.created_at ?? null,
      reply_to: message.REPLY_TO ?? message.reply_to ?? null,
      attachments: Array.isArray(rawAttachments) ? rawAttachments : [],
    };
  };

  // Load the saved authentication session.

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const storedSession = await SecureStore.getItemAsync(SESSION_KEY);

        if (!storedSession) {
          if (mounted) {
            setError("Your session has expired. Please sign in again.");

            setLoading(false);

            setChatInfoLoading(false);
          }

          return;
        }

        const session = JSON.parse(storedSession);

        const user = session.user || {};

        const userId =
          user.userId ?? user.USER_ID ?? user.user_id ?? user.id ?? null;

        if (!session.token) {
          throw new Error("No authentication token was found.");
        }

        if (mounted) {
          setToken(session.token);

          setCurrentUserId(userId);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load your session.");

          setLoading(false);

          setChatInfoLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch the selected chat's information for the navigation header.

  useEffect(() => {
    if (!chatId || !token) return;

    let cancelled = false;

    const fetchChatInfo = async () => {
      try {
        setChatInfoLoading(true);

        const response = await fetch(`${API_URL}/api/chats`, {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,

            Accept: "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Failed to load chat details.",
          );
        }

        const chats = Array.isArray(data.chats) ? data.chats : [];

        const selectedChat = chats.find(
          (item) => String(item.CHAT_ID ?? item.chat_id) === String(chatId),
        );

        if (!cancelled) {
          setChatInfo(selectedChat || null);
        }
      } catch (err) {
        console.error("Failed to load chat header:", err);

        if (!cancelled) setChatInfo(null);
      } finally {
        if (!cancelled) setChatInfoLoading(false);
      }
    };

    fetchChatInfo();

    return () => {
      cancelled = true;
    };
  }, [chatId, token]);

  // Fetch messages from the backend.

  const fetchMessages = useCallback(
    async (authToken) => {
      if (!chatId || !authToken) return;

      try {
        setError("");

        const response = await fetch(
          `${API_URL}/api/messages/${encodeURIComponent(chatId)}`,

          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${authToken}`,

              Accept: "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || data.error || "Failed to load messages.",
          );
        }

        const fetchedMessages = Array.isArray(data.messages)
          ? data.messages.map(normalizeMessage)
          : [];

        setMessages(fetchedMessages);
      } catch (err) {
        setError(err.message || "Unable to load messages.");
      } finally {
        setLoading(false);
      }
    },

    [chatId],
  );

  useEffect(() => {
    if (token && chatId) fetchMessages(token);
  }, [token, chatId, fetchMessages]);

  // Keyboard listeners.

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";

    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();

      hideSubscription.remove();
    };
  }, []);

  const sendAttachment = async () => {
    if (!selectedAttachment || sending || uploading) return;

    if (!chatId || !token) {
      Alert.alert("Unable to send", "Your chat session is not ready.");

      return;
    }

    setUploading(true);

    setError("");

    try {
      // 1. Upload the selected file to Cloudinary

      const cloudinaryResult = await uploadToCloudinary(
        selectedAttachment,

        token,
      );

      // 2. Prepare the attachment information for your backend

      const attachmentData = {
        fileName: selectedAttachment.name || "attachment",

        url: cloudinaryResult.secure_url,

        fileType: selectedAttachment.mimeType || "application/octet-stream",

        fileSize: selectedAttachment.size || cloudinaryResult.bytes || 0,
      };

      // 3. Determine the message type

      const messageType =
        selectedAttachment.kind === "image"
          ? "IMAGE"
          : selectedAttachment.kind === "video"
            ? "VIDEO"
            : "DOCUMENT";

      // 4. Send the message and attachment URL to your backend

      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,

          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          chatId: Number(chatId),

          messageText: text.trim() || null,

          messageType,

          replyTo: replyMessage?.message_id ?? null,

          attachments: [attachmentData],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Attachment could not be sent.",
        );
      }

      // 5. Add the sent message to the current chat

      const payload = data.data || {};

      const newMessage = normalizeMessage({
        MESSAGE_ID: payload.MESSAGE_ID,
        CHAT_ID: payload.CHAT_ID ?? Number(chatId),
        SENDER_ID: payload.SENDER_ID ?? currentUserId,
        SENDER_FULL_NAME: payload.SENDER_FULL_NAME,
        SENDER_USERNAME: payload.SENDER_USERNAME,
        MESSAGE_TEXT: payload.MESSAGE_TEXT ?? text.trim(),
        MESSAGE_TYPE: payload.MESSAGE_TYPE ?? messageType,
        SENT_AT: payload.SENT_AT ?? new Date().toISOString(),
        REPLY_TO: payload.REPLY_TO ?? replyMessage?.message_id ?? null,
        ATTACHMENTS: payload.ATTACHMENTS ?? [attachmentData],
      });

      setMessages((previousMessages) => {
        if (
          previousMessages.some(
            (message) =>
              String(message.message_id) === String(newMessage.message_id),
          )
        ) {
          return previousMessages;
        }

        return [...previousMessages, newMessage];
      });

      // 6. Clear the composer

      setSelectedAttachment(null);

      setText("");

      setReplyMessage(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      console.error("Attachment send error:", err);

      Alert.alert("Attachment not sent", err.message || "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Open the device gallery for photos and videos.

  // Open the device gallery for photos and videos.

  const pickMedia = async () => {
    setAttachmentMenuVisible(false);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],

        allowsMultipleSelection: false,

        quality: 1,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];

      if (!asset) return;

      const isVideo = asset.type === "video";

      const attachment = {
        uri: asset.uri,

        name: asset.fileName || (isVideo ? "video.mp4" : "image.jpg"),

        mimeType: asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg"),

        size: asset.fileSize || 0,

        kind: isVideo ? "video" : "image",

        file: asset.file || null,
      };

      console.log("Selected media:", attachment);

      setSelectedAttachment(attachment);
    } catch (err) {
      console.error("Media picker error:", err);

      Alert.alert("Unable to open gallery", err.message || "Please try again.");
    }
  };

  // Open the device document picker.

  // Open the device document picker.

  const pickDocument = async () => {
    setAttachmentMenuVisible(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "/",

        multiple: false,

        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];

      if (!asset) return;

      const attachment = {
        uri: asset.uri,

        name: asset.name || "document",

        mimeType: asset.mimeType || "application/octet-stream",

        size: asset.size || 0,

        kind: "document",

        file: asset.file || null,
      };

      console.log("Selected document:", attachment);

      setSelectedAttachment(attachment);
    } catch (err) {
      console.error("Document picker error:", err);

      Alert.alert(
        "Unable to open documents",

        err.message || "Please try again.",
      );
    }
  };

  // Send a message through the backend.

  const sendMessage = async () => {
    const trimmedText = text.trim();

    if (!trimmedText || sending) return;

    if (!chatId || !token) {
      Alert.alert("Unable to send", "Your chat session is not ready.");

      return;
    }

    setSending(true);

    setError("");

    try {
      const response = await fetch(`${API_URL}/api/messages`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,

          "Content-Type": "application/json",

          Accept: "application/json",
        },

        body: JSON.stringify({
          chatId: Number(chatId),

          messageText: trimmedText,

          messageType: "TEXT",

          replyTo: replyMessage?.message_id ?? null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || "Message could not be sent.",
        );
      }

      // The API's "message" property is a status string, so construct

      // the local message from the individual response fields.

      const payload = data.data || {};

      const newMessage = normalizeMessage({
        MESSAGE_ID: payload.MESSAGE_ID,
        CHAT_ID: payload.CHAT_ID ?? Number(chatId),
        SENDER_ID: payload.SENDER_ID ?? currentUserId,
        SENDER_FULL_NAME: payload.SENDER_FULL_NAME,
        SENDER_USERNAME: payload.SENDER_USERNAME,
        MESSAGE_TEXT: payload.MESSAGE_TEXT ?? trimmedText,
        MESSAGE_TYPE: payload.MESSAGE_TYPE ?? "TEXT",
        SENT_AT: payload.SENT_AT ?? new Date().toISOString(),
        REPLY_TO: payload.REPLY_TO ?? replyMessage?.message_id ?? null,
        ATTACHMENTS: payload.ATTACHMENTS ?? [],
      });

      setMessages((previousMessages) => {
        if (
          previousMessages.some(
            (message) =>
              String(message.message_id) === String(newMessage.message_id),
          )
        ) {
          return previousMessages;
        }

        return [...previousMessages, newMessage];
      });

      setText("");

      setReplyMessage(null);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err) {
      Alert.alert("Message not sent", err.message || "Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Reply handlers.

  const handleMessageLongPress = (message) => {
    setReplyMessage(normalizeMessage(message));
  };

  const clearReply = () => setReplyMessage(null);

  // Format message time.

  const formatTime = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "";

    return parsedDate.toLocaleTimeString([], {
      hour: "2-digit",

      minute: "2-digit",
    });
  };

  // Render a message.

  const renderMessage = ({ item }) => {
    const isMine =
      currentUserId != null && String(item.sender_id) === String(currentUserId);

    return (
      <Pressable
        onLongPress={() => handleMessageLongPress(item)}
        delayLongPress={300}
        style={[
          styles.messageRow,

          isMine ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,

            isMine ? styles.myBubble : styles.otherBubble,
          ]}
        >
          {!isMine && (
            <Text style={styles.senderName}>{item.sender_name || "User"}</Text>
          )}

          {Array.isArray(item.attachments) &&
            item.attachments.map((attachment, index) => {
              if (!attachment || typeof attachment !== "object") return null;
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
                    `${item.message_id}-${index}`
                  }
                  onPress={() => {
                    Linking.openURL(String(url)).catch(() =>
                      Alert.alert("Unable to open file", "Please try again."),
                    );
                  }}
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
              {item.content}
            </Text>

            <Text
              style={[
                styles.messageTime,

                isMine ? styles.myMessageTime : styles.otherMessageTime,
              ]}
            >
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  const composerBottom =
    Platform.OS === "android" ? keyboardHeight + 20 : keyboardHeight;

  // Loading state.

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen
          options={{
            headerTitle: () => (
              <ChatHeader
                chat={chatInfo}
                loading={chatInfoLoading}
                styles={styles}
              />
            ),
          }}
        />

        <ActivityIndicator size="large" color={theme.colors.primary} />

        <Text style={styles.statusText}>Loading messages...</Text>
      </View>
    );
  }

  // Error state.

  if (error && messages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Stack.Screen
          options={{
            headerTitle: () => (
              <ChatHeader
                chat={chatInfo}
                loading={chatInfoLoading}
                styles={styles}
              />
            ),
          }}
        />

        <Ionicons
          name="alert-circle-outline"
          size={38}
          color={theme.colors.onSurfaceVariant}
        />

        <Text style={styles.errorText}>{error}</Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);

            fetchMessages(token);
          }}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  // Main chat screen.

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <ChatHeader
              chat={chatInfo}
              loading={chatInfoLoading}
              styles={styles}
            />
          ),

          headerRight: () => (
            <Pressable
              onPress={() => router.push(`/chats/info/${chatId}`)}
              style={{ padding: 5 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={30}
                color={theme.colors.primary}
              />
            </Pressable>
          ),
        }}
      />

      <ImageBackground
        source={require("../../../assets/images/pattern.png")}
        style={styles.chatBackground}
        imageStyle={styles.backgroundImage}
      >
        {attachmentMenuVisible && (
          <View style={styles.attachmentMenu}>
            <Pressable style={styles.attachmentOption} onPress={pickMedia}>
              <View style={styles.mediaIconContainer}>
                <Ionicons name="images-outline" size={23} color="#FFFFFF" />
              </View>

              <Text style={styles.attachmentOptionText}>Media</Text>
            </Pressable>

            <Pressable style={styles.attachmentOption} onPress={pickDocument}>
              <View style={styles.documentIconContainer}>
                <Ionicons name="document-outline" size={23} color="#FFFFFF" />
              </View>

              <Text style={styles.attachmentOptionText}>Document</Text>
            </Pressable>
          </View>
        )}

        {error ? (
          <Pressable
            style={styles.inlineError}
            onPress={() => fetchMessages(token)}
          >
            <Text style={styles.inlineErrorText}>{error} Tap to retry.</Text>
          </Pressable>
        ) : null}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => String(item.message_id ?? index)}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        <View
          style={[
            styles.composerContainer,

            {
              bottom: composerBottom,
            },
          ]}
        >
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

              <Pressable onPress={clearReply} style={styles.closeReplyButton}>
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
                onPress={() => setSelectedAttachment(null)}
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
            <Pressable
              style={styles.addButton}
              onPress={() => setAttachmentMenuVisible((previous) => !previous)}
            >
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
                onPress={selectedAttachment ? sendAttachment : sendMessage}
                disabled={sending || uploading}
              >
                {sending || uploading ? (
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
      </ImageBackground>
    </View>
  );
}

// All colors come from the react-native-paper theme (MD3), so this

// recomputes automatically when the app switches between light and dark.

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,

      backgroundColor: theme.colors.background,
    },

    headerContainer: {
      flexDirection: "row",

      alignItems: "center",

      maxWidth: 250,
    },

    headerLoading: {
      fontSize: 15,

      color: theme.colors.onSurfaceVariant,
    },

    headerAvatar: {
      width: 38,

      height: 38,

      borderRadius: 19,

      backgroundColor: theme.colors.surfaceVariant,

      alignItems: "center",

      justifyContent: "center",

      marginRight: 10,

      overflow: "hidden",
    },

    headerAvatarImage: {
      width: 38,

      height: 38,
    },

    headerAvatarImageStyle: {
      borderRadius: 19,
    },

    headerAvatarText: {
      fontSize: 16,

      color: theme.colors.onSurfaceVariant,

      fontWeight: "600",
    },

    headerTextContainer: {
      flexShrink: 1,
    },

    headerName: {
      fontSize: 16,

      fontWeight: "600",

      color: theme.colors.onSurface,
    },

    headerStatus: {
      fontSize: 12,

      color: theme.colors.onSurfaceVariant,
    },

    chatBackground: {
      flex: 1,
    },

    backgroundImage: {
      opacity: theme.dark ? 0.15 : 0.45,
    },

    messageList: {
      paddingHorizontal: 10,

      paddingTop: 12,

      paddingBottom: 90,

      flexGrow: 1,
    },

    messageRow: {
      width: "100%",

      marginVertical: 2,
    },

    myMessageRow: {
      alignItems: "flex-end",
    },

    otherMessageRow: {
      alignItems: "flex-start",
    },

    messageBubble: {
      maxWidth: "82%",

      minWidth: 60,

      paddingHorizontal: 10,

      paddingTop: 6,

      paddingBottom: 5,

      borderRadius: 12,
    },

    myBubble: {
      backgroundColor: theme.colors.primaryContainer,

      borderTopRightRadius: 4,
    },

    otherBubble: {
      backgroundColor: theme.colors.elevation.level1,

      borderTopLeftRadius: 4,
    },

    senderName: {
      fontSize: 14,

      fontWeight: "600",

      color: theme.colors.primary,

      marginBottom: 2,
    },

    messageContentRow: {
      flexDirection: "row",

      alignItems: "flex-end",
    },

    messageText: {
      fontSize: 16,

      lineHeight: 21,

      flexShrink: 1,
    },

    myMessageText: {
      color: theme.colors.onPrimaryContainer,
    },

    otherMessageText: {
      color: theme.colors.onSurface,
    },

    messageTime: {
      fontSize: 11,

      marginLeft: 8,

      marginBottom: 1,
    },

    myMessageTime: {
      color: theme.colors.onPrimaryContainer,

      opacity: 0.7,
    },

    otherMessageTime: {
      color: theme.colors.onSurfaceVariant,
    },

    composerContainer: {
      position: "absolute",

      left: 0,

      right: 0,

      backgroundColor: theme.colors.background,
    },

    replyBar: {
      minHeight: 55,

      flexDirection: "row",

      alignItems: "center",

      backgroundColor: theme.colors.surfaceVariant,

      borderTopWidth: 1,

      borderTopColor: theme.colors.outlineVariant,
    },

    replyIndicator: {
      width: 5,

      height: "100%",

      backgroundColor: theme.colors.primary,
    },

    replyContent: {
      flex: 1,

      paddingHorizontal: 10,

      paddingVertical: 6,
    },

    replyTitle: {
      fontSize: 14,

      fontWeight: "600",

      color: theme.colors.primary,
    },

    replyText: {
      fontSize: 14,

      color: theme.colors.onSurfaceVariant,

      marginTop: 2,
    },

    closeReplyButton: {
      paddingHorizontal: 10,
    },

    inputContainer: {
      flexDirection: "row",

      alignItems: "flex-end",

      paddingHorizontal: 8,

      paddingVertical: 6,

      backgroundColor: theme.colors.surface,

      borderTopWidth: 1,

      borderTopColor: theme.colors.outlineVariant,
    },

    addButton: {
      width: 40,

      height: 44,

      alignItems: "center",

      justifyContent: "center",
    },

    inputIcon: {
      width: 40,

      height: 44,

      alignItems: "center",

      justifyContent: "center",
    },

    textInput: {
      flex: 1,

      maxHeight: 100,

      minHeight: 42,

      backgroundColor: theme.colors.background,

      borderRadius: 20,

      borderWidth: 1,

      borderColor: theme.colors.outline,

      paddingHorizontal: 15,

      paddingTop: 10,

      paddingBottom: 9,

      fontSize: 16,

      color: theme.colors.onSurface,
    },

    sendButton: {
      width: 40,

      height: 40,

      borderRadius: 20,

      backgroundColor: theme.colors.primary,

      alignItems: "center",

      justifyContent: "center",

      marginLeft: 5,

      marginBottom: 2,
    },

    sendButtonDisabled: {
      opacity: 0.65,
    },

    errorContainer: {
      flex: 1,

      alignItems: "center",

      justifyContent: "center",

      paddingHorizontal: 25,

      backgroundColor: theme.colors.background,
    },

    errorText: {
      fontSize: 16,

      color: theme.colors.onSurfaceVariant,

      textAlign: "center",

      marginTop: 12,
    },

    statusText: {
      fontSize: 15,

      color: theme.colors.onSurfaceVariant,

      marginTop: 12,
    },

    retryButton: {
      marginTop: 18,

      backgroundColor: theme.colors.primary,

      paddingHorizontal: 24,

      paddingVertical: 10,

      borderRadius: 20,
    },

    retryButtonText: {
      color: theme.colors.onPrimary,

      fontWeight: "600",
    },

    inlineError: {
      paddingHorizontal: 12,

      paddingVertical: 8,

      backgroundColor: theme.colors.errorContainer,
    },

    inlineErrorText: {
      color: theme.colors.onErrorContainer,

      textAlign: "center",
    },

    emptyContainer: {
      flex: 1,

      alignItems: "center",

      justifyContent: "center",

      paddingTop: 30,
    },

    emptyText: {
      color: theme.colors.onSurfaceVariant,

      fontSize: 15,
    },

    attachmentMenu: {
      position: "absolute",

      bottom: 85,

      left: 12,

      zIndex: 1000,

      elevation: 8,

      backgroundColor: theme.colors.surface,

      borderRadius: 18,

      paddingVertical: 8,

      paddingHorizontal: 8,

      minWidth: 175,

      borderWidth: 1,

      borderColor: theme.colors.outlineVariant,

      shadowColor: "#000",

      shadowOffset: {
        width: 0,

        height: 4,
      },

      shadowOpacity: 0.18,

      shadowRadius: 8,
    },

    attachmentOption: {
      flexDirection: "row",

      alignItems: "center",

      paddingHorizontal: 10,

      paddingVertical: 10,

      borderRadius: 12,
    },

    attachmentOptionText: {
      fontSize: 15,

      fontWeight: "500",

      color: theme.colors.onSurface,

      marginLeft: 12,
    },

    mediaIconContainer: {
      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor: "#8B5CF6",

      alignItems: "center",

      justifyContent: "center",
    },

    documentIconContainer: {
      width: 42,

      height: 42,

      borderRadius: 21,

      backgroundColor: "#3B82F6",

      alignItems: "center",

      justifyContent: "center",

      attachmentPreview: {
        flexDirection: "row",

        alignItems: "center",

        padding: 10,

        marginHorizontal: 8,

        marginBottom: 6,

        borderRadius: 12,

        backgroundColor: theme.colors.surfaceVariant,
      },

      attachmentPreviewImage: {
        width: 55,

        height: 55,

        borderRadius: 8,
      },

      attachmentPreviewInfo: {
        flex: 1,

        marginLeft: 12,
      },

      attachmentPreviewName: {
        fontSize: 14,

        fontWeight: "600",

        color: theme.colors.onSurface,
      },

      attachmentPreviewType: {
        fontSize: 12,

        marginTop: 4,

        color: theme.colors.onSurfaceVariant,
      },

      removeAttachmentButton: {
        padding: 5,
      },
    },

    chatAttachment: {
      marginBottom: 6,

      borderRadius: 10,

      overflow: "hidden",
    },

    chatAttachmentImage: {
      width: 220,

      height: 200,

      borderRadius: 10,
    },

    chatAttachmentFile: {
      flexDirection: "row",

      alignItems: "center",

      padding: 12,

      borderRadius: 10,

      backgroundColor: theme.colors.surfaceVariant,

      minWidth: 190,

      maxWidth: 250,
    },

    chatAttachmentFileName: {
      flex: 1,

      marginHorizontal: 10,

      fontSize: 14,

      color: theme.colors.onSurface,
    },
  });
