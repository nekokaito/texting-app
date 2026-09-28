import { API_URL } from "../constants/API";

async function parseResponse(response) {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || data.error || "Request failed.",
    );
  }

  return data;
}

export async function fetchChatMessages(chatId, token) {
  const response = await fetch(
    `${API_URL}/api/messages/${encodeURIComponent(chatId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    },
  );

  return parseResponse(response);
}

export async function fetchChats(token) {
  const response = await fetch(`${API_URL}/api/chats`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  return parseResponse(response);
}

export async function createMessage({
  token,
  chatId,
  messageText,
  messageType,
  replyTo,
  attachments,
}) {
  const response = await fetch(`${API_URL}/api/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      chatId: Number(chatId),
      messageText,
      messageType,
      replyTo,
      ...(attachments ? { attachments } : {}),
    }),
  });

  return parseResponse(response);
}
