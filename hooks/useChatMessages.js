import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";

import { createMessage, fetchChatMessages } from "../services/chatService";
import { uploadToCloudinary } from "../services/mediaService";
import { getSocket } from "../services/socket";
import { normalizeMessage } from "../utils/messageUtils";

export function useChatMessages({ chatId, token, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [replyMessage, setReplyMessage] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const addMessageIfMissing = useCallback((message) => {
    setMessages((previousMessages) => {
      if (
        previousMessages.some(
          (item) => String(item.message_id) === String(message.message_id),
        )
      ) {
        return previousMessages;
      }

      return [...previousMessages, message];
    });
  }, []);

  // ---------------------------------------------------------
  // Mark a received message as DELIVERED
  // ---------------------------------------------------------

  const markAsDelivered = useCallback(
    (message) => {
      if (!message?.message_id || !chatId) {
        return;
      }

      // Do not mark our own messages as delivered.
      if (
        currentUserId &&
        String(message.sender_id) === String(currentUserId)
      ) {
        return;
      }

      const socket = getSocket();

      if (!socket) {
        console.log(
          "[Chat] Socket unavailable - cannot mark message delivered",
        );
        return;
      }

      socket.emit("message_delivered", {
        messageId: message.message_id,
        chatId: Number(chatId),
      });

      console.log(`[Chat] Message ${message.message_id} marked as delivered`);
    },
    [chatId, currentUserId],
  );

  // ---------------------------------------------------------
  // Add incoming real-time message
  // ---------------------------------------------------------

  const addIncomingMessage = useCallback(
    (message) => {
      const normalizedMessage = normalizeMessage(message);

      addMessageIfMissing(normalizedMessage);

      // Tell backend that this user's device received it.
      markAsDelivered(normalizedMessage);
    },
    [addMessageIfMissing, markAsDelivered],
  );

  // ---------------------------------------------------------
  // Fetch messages
  // ---------------------------------------------------------

  const fetchMessages = useCallback(async () => {
    if (!chatId || !token) return;

    try {
      setError("");

      const data = await fetchChatMessages(chatId, token);

      const fetchedMessages = Array.isArray(data.messages)
        ? data.messages.map(normalizeMessage)
        : [];

      setMessages(fetchedMessages);
    } catch (err) {
      setError(err.message || "Unable to load messages.");
    } finally {
      setLoading(false);
    }
  }, [chatId, token]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ---------------------------------------------------------
  // Send text message
  // ---------------------------------------------------------

  const sendMessage = async () => {
    const trimmedText = text.trim();

    if (!trimmedText || sending) {
      return false;
    }

    if (!chatId || !token) {
      Alert.alert("Unable to send", "Your chat session is not ready.");

      return false;
    }

    setSending(true);
    setError("");

    try {
      const data = await createMessage({
        token,
        chatId,
        messageText: trimmedText,
        messageType: "TEXT",
        replyTo: replyMessage?.message_id ?? null,
      });

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

      addMessageIfMissing(newMessage);

      setText("");
      setReplyMessage(null);

      return true;
    } catch (err) {
      Alert.alert("Message not sent", err.message || "Please try again.");

      return false;
    } finally {
      setSending(false);
    }
  };

  // ---------------------------------------------------------
  // Send attachment
  // ---------------------------------------------------------

  const sendAttachment = async () => {
    if (!selectedAttachment || sending || uploading) {
      return false;
    }

    if (!chatId || !token) {
      Alert.alert("Unable to send", "Your chat session is not ready.");

      return false;
    }

    setUploading(true);
    setError("");

    try {
      const cloudinaryResult = await uploadToCloudinary(
        selectedAttachment,
        token,
      );

      const attachmentData = {
        fileName: selectedAttachment.name || "attachment",

        url: cloudinaryResult.secure_url,

        fileType: selectedAttachment.mimeType || "application/octet-stream",

        fileSize: selectedAttachment.size || cloudinaryResult.bytes || 0,
      };

      const messageType =
        selectedAttachment.kind === "image"
          ? "IMAGE"
          : selectedAttachment.kind === "video"
            ? "VIDEO"
            : "DOCUMENT";

      const data = await createMessage({
        token,
        chatId,
        messageText: text.trim() || null,
        messageType,
        replyTo: replyMessage?.message_id ?? null,
        attachments: [attachmentData],
      });

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

      addMessageIfMissing(newMessage);

      setSelectedAttachment(null);
      setText("");
      setReplyMessage(null);

      return true;
    } catch (err) {
      console.error("Attachment send error:", err);

      Alert.alert("Attachment not sent", err.message || "Please try again.");

      return false;
    } finally {
      setUploading(false);
    }
  };

  return {
    messages,
    loading,
    error,
    setError,
    fetchMessages,
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
    addIncomingMessage,
    markAsDelivered,
    setMessages,
  };
}
