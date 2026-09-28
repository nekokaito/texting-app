import { useEffect, useState } from "react";
import { getItem } from "../utils/storage";

export function useChatSession() {
  const [token, setToken] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const storedSession = await getItem("user_session");

        if (!storedSession) {
          throw new Error("Your session has expired. Please sign in again.");
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
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    token,
    currentUserId,
    loading,
    error,
  };
}
