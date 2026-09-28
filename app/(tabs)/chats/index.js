import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTheme } from "react-native-paper";

import ChatRow from "../../../components/ChatRow";
import { API_URL } from "../../../constants/API";
import { defaultStyles } from "../../../constants/Styles";
import { getItem } from "../../../utils/storage";

const SESSION_KEY = "user_session";

export default function ChatIndex() {
  const { colors } = useTheme();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchChats = useCallback(async () => {
    try {
      setError("");

      if (!API_URL) {
        throw new Error("API URL is not configured.");
      }

      // Retrieve the saved authentication session.
      const sessionData = await getItem(SESSION_KEY);

      if (!sessionData) {
        throw new Error("Your session has expired. Please log in again.");
      }

      let session;

      try {
        session = JSON.parse(sessionData);
      } catch {
        throw new Error("Your saved session is invalid. Please log in again.");
      }

      if (!session?.token) {
        throw new Error("Authentication token is missing.");
      }

      // Fetch the logged-in user's conversations.
      const response = await fetch(`${API_URL}/api/chats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
      });

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error("Chats API returned invalid JSON.");
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Failed to fetch conversations. HTTP ${response.status}`,
        );
      }

      if (!Array.isArray(data.chats)) {
        throw new Error(
          "The server returned an invalid conversations response.",
        );
      }

      setChats(data.chats);
    } catch (err) {
      console.error("Fetch chats error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch chats whenever the screen becomes active.
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchChats();
    }, [fetchChats]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChats();
  }, [fetchChats]);

  const renderItem = ({ item }) => {
    return <ChatRow chat={item} />;
  };

  const renderEmpty = () => {
    if (loading) {
      return null;
    }

    if (error) {
      return (
        <View style={styles.messageContainer}>
          <Text
            style={{
              color: colors.error,
              textAlign: "center",
            }}
          >
            {error}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.messageContainer}>
        <Text style={{ color: colors.onSurfaceVariant }}>
          No conversations yet.
        </Text>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Stack.Screen
        options={{
          title: "Chats",
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.onSurface,
        }}
      />

      {loading && chats.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={(item, index) =>
            item.CHAT_ID != null ? String(item.CHAT_ID) : String(index)
          }
          ItemSeparatorComponent={() => (
            <View
              style={[
                defaultStyles.separator,
                {
                  marginLeft: 90,
                  backgroundColor: colors.border,
                },
              ]}
            />
          )}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 40,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
