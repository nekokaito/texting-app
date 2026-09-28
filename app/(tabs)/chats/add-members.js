import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    ActivityIndicator,
    Button,
    Checkbox,
    Surface,
    useTheme,
} from "react-native-paper";

import { API_URL } from "../../../constants/API";
import { getItem } from "../../../utils/storage";

export default function AddMembersScreen() {
  const { chatId } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;

  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);

      const storedSession = await getItem("user_session");
      if (!storedSession) {
        setError("Session expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const session = JSON.parse(storedSession);
      const token = session.token;

      // Fetch list of all available users in the app
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch users.");
      }

      setUsers(data?.users || data || []);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  function toggleUserSelection(userId) {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  }

  async function handleAddMembers() {
    if (selectedUserIds.length === 0) {
      Alert.alert("Notice", "Please select at least one user to add.");
      return;
    }

    try {
      setSubmitting(true);

      const storedSession = await getItem("user_session");
      const session = JSON.parse(storedSession || "{}");
      const token = session.token;

      const response = await fetch(`${API_URL}/api/chats/${chatId}/members`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          memberIds: selectedUserIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to add members.");
      }

      Alert.alert("Success", "Members added successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.error("Add Members Error:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Add Members",
          headerBackTitleVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.onBackground,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {error ? (
          <View style={styles.center}>
            <Text style={{ color: colors.error }}>{error}</Text>
            <Button mode="contained" onPress={fetchUsers} style={{ marginTop: 12 }}>
              Retry
            </Button>
          </View>
        ) : (
          <>
            <FlatList
              data={users}
              keyExtractor={(item) => String(item.userId || item.id)}
              renderItem={({ item }) => {
                const userId = item.userId || item.id;
                const isSelected = selectedUserIds.includes(userId);

                return (
                  <Pressable
                    style={[
                      styles.userRow,
                      { borderBottomColor: colors.outlineVariant },
                    ]}
                    onPress={() => toggleUserSelection(userId)}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={40}
                      color={colors.onSurfaceVariant}
                    />

                    <View style={styles.userInfo}>
                      <Text style={[styles.userName, { color: colors.onSurface }]}>
                        {item.fullName || item.username || "User"}
                      </Text>
                      {item.username && (
                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 13 }}>
                          @{item.username}
                        </Text>
                      )}
                    </View>

                    <Checkbox
                      status={isSelected ? "checked" : "unchecked"}
                      onPress={() => toggleUserSelection(userId)}
                      color={colors.primary}
                    />
                  </Pressable>
                );
              }}
              contentContainerStyle={styles.listContent}
            />

            <Surface
              elevation={2}
              style={[
                styles.bottomBar,
                { backgroundColor: colors.surface },
              ]}
            >
              <Button
                mode="contained"
                onPress={handleAddMembers}
                loading={submitting}
                disabled={submitting || selectedUserIds.length === 0}
                style={styles.addButton}
              >
                Add {selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ""}
              </Button>
            </Surface>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  listContent: {
    paddingBottom: 80,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  addButton: {
    borderRadius: 8,
  },
});