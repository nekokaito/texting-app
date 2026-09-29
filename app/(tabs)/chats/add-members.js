import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Image,
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
  }, [chatId]);

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
      const currentUserId = session.user?.USER_ID || session.user?.userId;

      // 1. Fetch existing group members to exclude them
      let existingMemberIds = new Set();
      if (chatId) {
        try {
          const membersRes = await fetch(`${API_URL}/api/chats/${chatId}/members`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          const membersData = await membersRes.json();
          if (membersRes.ok) {
            const memberList = membersData?.members || membersData || [];
            memberList.forEach((m) => {
              const id = m.USER_ID || m.userId || m.id;
              if (id) existingMemberIds.add(String(id));
            });
          }
        } catch (e) {
          console.warn("Could not fetch existing group members:", e);
        }
      }

      // 2. Fetch all available users
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

      const rawUsers = data?.users || data || [];

      // Filter out current user & existing group members
      const availableUsers = rawUsers.filter((u) => {
        const uId = String(u.USER_ID || u.userId || u.id);
        const isSelf = currentUserId && String(currentUserId) === uId;
        const isAlreadyMember = existingMemberIds.has(uId);
        return !isSelf && !isAlreadyMember;
      });

      setUsers(availableUsers);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  function toggleUserSelection(userId) {
    const normalizedId = String(userId);
    if (selectedUserIds.includes(normalizedId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== normalizedId));
    } else {
      setSelectedUserIds([...selectedUserIds, normalizedId]);
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
      <>
        <Stack.Screen
          options={{
            title: "Add Members",
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.onBackground,
          }}
        />
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
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
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={colors.error}
            />
            <Text style={[styles.errorText, { color: colors.error }]}>
              {error}
            </Text>
            <Button
              mode="contained"
              onPress={fetchUsers}
              style={{ marginTop: 16 }}
            >
              Retry
            </Button>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.center}>
            <Ionicons
              name="people-outline"
              size={48}
              color={colors.onSurfaceVariant}
            />
            <Text
              style={[
                styles.emptyText,
                { color: colors.onSurfaceVariant },
              ]}
            >
              No new members available to add.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={users}
              keyExtractor={(item) =>
                String(item.USER_ID || item.userId || item.id)
              }
              renderItem={({ item }) => {
                const userId = String(item.USER_ID || item.userId || item.id);
                const isSelected = selectedUserIds.includes(userId);
                const fullName =
                  item.FULL_NAME ||
                  item.fullName ||
                  item.DISPLAY_NAME ||
                  item.username ||
                  "User";
                const username = item.USERNAME || item.username;
                const profilePic = item.PROFILE_PICTURE || item.profilePicture;

                return (
                  <Pressable
                    style={[
                      styles.userRow,
                      { borderBottomColor: colors.outlineVariant },
                    ]}
                    onPress={() => toggleUserSelection(userId)}
                  >
                    {profilePic ? (
                      <Image
                        source={{ uri: profilePic }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarPlaceholder,
                          { backgroundColor: colors.surfaceVariant },
                        ]}
                      >
                        <Ionicons
                          name="person"
                          size={22}
                          color={colors.onSurfaceVariant}
                        />
                      </View>
                    )}

                    <View style={styles.userInfo}>
                      <Text
                        style={[
                          styles.userName,
                          { color: colors.onSurface },
                        ]}
                      >
                        {fullName}
                      </Text>
                      {username && (
                        <Text
                          style={{
                            color: colors.onSurfaceVariant,
                            fontSize: 13,
                          }}
                        >
                          @{username}
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
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginTop: 10,
  },
  listContent: {
    paddingBottom: 90,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
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