import { useEffect, useState } from "react";
import { connectSocket } from "../services/socket";

export function useSocket() {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function setupSocket() {
      const connectedSocket = await connectSocket();

      if (mounted) {
        setSocket(connectedSocket);
      }
    }

    setupSocket();

    return () => {
      mounted = false;
    };
  }, []);

  return socket;
}
