export function normalizeMessage(message = {}) {
  const rawAttachments =
    message.MESSAGE_ATTACHMENTS ??
    message.ATTACHMENTS ??
    message.attachments ??
    [];

  return {
    message_id:
      message.MESSAGE_ID ?? message.message_id ?? null,
    chat_id: message.CHAT_ID ?? message.chat_id ?? null,
    sender_id:
      message.SENDER_ID ?? message.sender_id ?? null,
    sender_name:
      message.SENDER_FULL_NAME ??
      message.FULL_NAME ??
      message.SENDER_USERNAME ??
      message.USERNAME ??
      message.sender_name ??
      "User",
    content:
      message.MESSAGE_TEXT ?? message.content ?? "",
    message_type:
      message.MESSAGE_TYPE ?? message.message_type ?? "TEXT",
    created_at:
      message.SENT_AT ?? message.created_at ?? null,
    reply_to:
      message.REPLY_TO ?? message.reply_to ?? null,
    attachments: Array.isArray(rawAttachments)
      ? rawAttachments
      : [],
  };
}

export function formatMessageTime(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
