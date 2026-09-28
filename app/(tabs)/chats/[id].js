import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";

import AttachmentMenu from "../../../components/chat/AttachmentMenu";
import ChatComposer from "../../../components/chat/ChatComposer";
import ChatHeader from "../../../components/chat/ChatHeader";
import MessageBubble from "../../../components/chat/MessageBubble";
import { API_URL } from "../../../constants/API";
import { useChatAttachments } from "../../../hooks/useChatAttachments";
import { useChatMessages } from "../../../hooks/useChatMessages";
import { useChatSession } from "../../../hooks/useChatSession";
import { useKeyboardHeight } from "../../../hooks/useKeyboardHeight";
import { createChatStyles } from "../../../styles/chatStyles";

export default function ChatPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => createChatStyles(theme), [theme]);
  const chatId = Array.isArray(id) ? id[0] : id;

  const flatListRef = useRef(null);
  const [chatInfo, setChatInfo] = useState(null);
  const [chatInfoLoading, setChatInfoLoading] = useState(true);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);

  const {
    token,
    currentUserId,
    loading: sessionLoading,
    error: sessionError,
  } = useChatSession();

  const {
    messages,
    loading: messagesLoading,
    error,
    setError,
    sendMessage,
    sendAttachment,
    sending,
    uploading,
    replyMessage,
    setReplyMessage,
    selectedAttachment,
    setSelectedAttachment,
    text,
    setText,
    fetchMessages,
  } = useChatMessages({
    chatId,
    token,
    currentUserId,
  });

  const { keyboardHeight } = useKeyboardHeight();

  const { pickMedia, pickDocument } = useChatAttachments({
    onAttachmentSelected: setSelectedAttachment,
    onCloseMenu: () => setAttachmentMenuVisible(false),
  });

  const loading = sessionLoading || messagesLoading;
  const displayError = sessionError || error;

  useEffect(() => {
    if (!chatId || !token) return;

    let cancelled = false;

    const loadChatInfo = async () => {
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
        if (!cancelled) {
          setChatInfo(null);
        }
      } finally {
        if (!cancelled) {
          setChatInfoLoading(false);
        }
      }
    };

    loadChatInfo();

    return () => {
      cancelled = true;
    };
  }, [chatId, token]);

  const scrollToEnd = (animated = true) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  const handleSendMessage = async () => {
    const success = await sendMessage();
    if (success) scrollToEnd();
  };

  const handleSendAttachment = async () => {
    const success = await sendAttachment();
    if (success) scrollToEnd();
  };

  const handleRetry = () => {
    setError("");
    fetchMessages();
  };

  const handleMessageLongPress = (message) => {
    setReplyMessage(message);
  };

  const composerBottom =
    Platform.OS === "android" ? keyboardHeight + 20 : keyboardHeight;

  const screenHeader = (
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
  );

  if (loading) {
    return (
      <View style={styles.errorContainer}>
        {screenHeader}
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.statusText}>Loading messages...</Text>
      </View>
    );
  }

  if (displayError && messages.length === 0) {
    return (
      <View style={styles.errorContainer}>
        {screenHeader}
        <Ionicons
          name="alert-circle-outline"
          size={38}
          color={theme.colors.onSurfaceVariant}
        />
        <Text style={styles.errorText}>{displayError}</Text>
        <Pressable style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {screenHeader}

      <ImageBackground
        source={require("../../../assets/images/pattern.png")}
        style={styles.chatBackground}
        imageStyle={styles.backgroundImage}
      >
        {attachmentMenuVisible && (
          <AttachmentMenu
            styles={styles}
            onMediaPress={pickMedia}
            onDocumentPress={pickDocument}
          />
        )}

        {displayError ? (
          <Pressable style={styles.inlineError} onPress={handleRetry}>
            <Text style={styles.inlineErrorText}>
              {displayError} Tap to retry.
            </Text>
          </Pressable>
        ) : null}

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => String(item.message_id ?? index)}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              currentUserId={currentUserId}
              theme={theme}
              styles={styles}
              onLongPress={handleMessageLongPress}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
            </View>
          }
        />

        <ChatComposer
          styles={styles}
          theme={theme}
          bottom={composerBottom}
          text={text}
          setText={setText}
          replyMessage={replyMessage}
          currentUserId={currentUserId}
          onClearReply={() => setReplyMessage(null)}
          selectedAttachment={selectedAttachment}
          onRemoveAttachment={() => setSelectedAttachment(null)}
          attachmentMenuVisible={attachmentMenuVisible}
          onToggleAttachmentMenu={() =>
            setAttachmentMenuVisible((previous) => !previous)
          }
          onSend={selectedAttachment ? handleSendAttachment : handleSendMessage}
          sending={sending}
          uploading={uploading}
        />
      </ImageBackground>
    </View>
  );
}
