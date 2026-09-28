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
import { getSocket } from "../../../services/socket";
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
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserLastSeen, setOtherUserLastSeen] = useState(null);
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
    setMessages,
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
    addIncomingMessage,
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

    const socket = getSocket();

    if (!socket) {
      console.log("[Chat] Socket is not available");
      return;
    }

    socket.emit("join_chat", { chatId });

    console.log("[Chat] Joined chat room:", chatId);

    return () => {
      socket.emit("leave_chat", { chatId });

      console.log("[Chat] Left chat room:", chatId);
    };
  }, [chatId, token]);

  useEffect(() => {
    if (!chatId || !token) return;

    const socket = getSocket();

    if (!socket) {
      console.log("[Chat] Socket is not available for messages");
      return;
    }

    const handleReceiveMessage = (message) => {
      console.log("[Chat] Live message received:", message);

      const incomingChatId =
        message.CHAT_ID ?? message.chat_id ?? message.chatId;

      if (String(incomingChatId) !== String(chatId)) {
        return;
      }

      addIncomingMessage(message);

      const messageId = message.MESSAGE_ID ?? message.message_id;

      const senderId = message.SENDER_ID ?? message.sender_id;

      // Only mark messages from OTHER users as seen.
      if (messageId && senderId && String(senderId) !== String(currentUserId)) {
        markMessageAsSeen({
          message_id: messageId,
          sender_id: senderId,
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [chatId, token, addIncomingMessage]);

  useEffect(() => {
    if (!chatId || !token) return;

    const socket = getSocket();

    if (!socket) {
      console.log("[Chat] Socket is not available for message status");
      return;
    }

    const handleMessageStatus = (statusUpdate) => {
      console.log("[Chat] Message status update:", statusUpdate);

      const incomingChatId =
        statusUpdate.chatId ?? statusUpdate.CHAT_ID ?? statusUpdate.chat_id;

      if (incomingChatId && String(incomingChatId) !== String(chatId)) {
        return;
      }

      const messageId =
        statusUpdate.messageId ??
        statusUpdate.MESSAGE_ID ??
        statusUpdate.message_id;

      const status =
        statusUpdate.status ??
        statusUpdate.STATUS ??
        statusUpdate.message_status;

      if (!messageId || !status) {
        return;
      }

      setMessages((previousMessages) =>
        previousMessages.map((message) => {
          if (String(message.message_id) !== String(messageId)) {
            return message;
          }

          return {
            ...message,
            message_status: String(status).toUpperCase(),
          };
        }),
      );
    };

    socket.on("message_status", handleMessageStatus);

    return () => {
      socket.off("message_status", handleMessageStatus);
    };
  }, [chatId, token]);

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

          if (selectedChat) {
            const initialOnline =
              selectedChat.OTHER_IS_ONLINE === "Y" ||
              selectedChat.OTHER_IS_ONLINE === true;

            setOtherUserOnline(initialOnline);

            if (initialOnline) {
              setOtherUserLastSeen(null);
            }
          }
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

  useEffect(() => {
    if (!chatId || !token || !chatInfo?.OTHER_USER_ID) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      console.log("[Presence] Socket is not available");
      return;
    }

    const otherUserId = Number(chatInfo.OTHER_USER_ID);

    console.log("[Presence] Watching user:", otherUserId);

    const formatLastSeen = (lastSeen) => {
      if (!lastSeen) {
        return null;
      }

      const date = new Date(lastSeen);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      const now = new Date();

      const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate();

      if (isToday) {
        return `today at ${date.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`;
      }

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const isYesterday =
        date.getFullYear() === yesterday.getFullYear() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getDate() === yesterday.getDate();

      if (isYesterday) {
        return `yesterday at ${date.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}`;
      }

      return `on ${date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      })} at ${date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    };

    const handleUserStatus = (statusUpdate) => {
      console.log("[Presence] User status update:", statusUpdate);

      const incomingUserId =
        statusUpdate?.userId ?? statusUpdate?.USER_ID ?? statusUpdate?.user_id;

      if (!incomingUserId) {
        return;
      }

      if (String(incomingUserId) !== String(otherUserId)) {
        return;
      }

      const status = String(
        statusUpdate?.status ?? statusUpdate?.STATUS ?? "OFFLINE",
      ).toUpperCase();

      const online = status === "ONLINE";

      setOtherUserOnline(online);

      if (online) {
        setOtherUserLastSeen(null);
      } else {
        setOtherUserLastSeen(formatLastSeen(statusUpdate?.lastSeen));
      }
    };

    socket.on("user_status", handleUserStatus);

    socket.emit("get_user_status", {
      userId: otherUserId,
    });

    console.log("[Presence] Requested status for user:", otherUserId);

    return () => {
      socket.off("user_status", handleUserStatus);
    };
  }, [chatId, token, chatInfo?.OTHER_USER_ID]);

  const scrollToEnd = (animated = true) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({
          animated,
        });
      });
    });
  };

  const handleSendMessage = async () => {
    const success = await sendMessage();

    if (success) {
      scrollToEnd();
    }
  };

  const handleSendAttachment = async () => {
    const success = await sendAttachment();

    if (success) {
      scrollToEnd();
    }
  };

  const handleRetry = () => {
    setError("");
    fetchMessages();
  };

  const markMessageAsSeen = (message) => {
    if (!message?.message_id || !chatId || !currentUserId) {
      return;
    }

    // Don't mark our own messages as seen
    if (String(message.sender_id) === String(currentUserId)) {
      return;
    }

    const socket = getSocket();

    if (!socket) {
      console.log("[Chat] Socket is not available for seen status");
      return;
    }

    socket.emit("message_seen", {
      messageId: message.message_id,
      chatId: Number(chatId),
    });

    console.log(`[Chat] Message ${message.message_id} marked as seen`);
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
            isOnline={otherUserOnline}
            lastSeen={otherUserLastSeen}
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
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              currentUserId={currentUserId}
              theme={theme}
              styles={styles}
              onLongPress={handleMessageLongPress}
              isLastMessage={index === messages.length - 1}
            />
          )}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => {
            scrollToEnd(true);
          }}
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
