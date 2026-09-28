import { io } from "socket.io-client";
import { getItem } from "../utils/storage";

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;

let socket = null;

export async function connectSocket() {
  const sessionString = await getItem("user_session");

  if (!sessionString) {
    console.log("[Socket] No session found");
    return null;
  }

  let session;

  try {
    session = JSON.parse(sessionString);
  } catch (error) {
    console.log("[Socket] Invalid session data");
    return null;
  }

  const token = session?.token;

  if (!token) {
    console.log("[Socket] No token found");
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  console.log("[Socket] Connecting...");

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket.id);
  });

  socket.on("connect_error", (error) => {
    console.log("[Socket] Connection error:", error.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[Socket] Disconnected:", reason);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
