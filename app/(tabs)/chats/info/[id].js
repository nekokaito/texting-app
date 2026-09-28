import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Surface,
  useTheme,
} from "react-native-paper";

import { API_URL } from "../../../../constants/API";
import { getItem } from "../../../../utils/storage";

export default function ChatInfoPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const { colors } = theme;

  const [loading, setLoading] = useState(true);
  const [chat, setChat] = useState(null);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChatInfo();
  }, [id]);

  async function loadChatInfo() {
    if (!id) {
      setError("Chat ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const storedSession = await getItem("user_session");

      if (!storedSession) {
        setError("Your session has expired. Please sign in again.");
        setLoading(false);
        return;
      }

      const session = JSON.parse(storedSession);
      const token = session.token;

      if (!token) {
        setError("No authentication token was found.");
        setLoading(false);
        return;
      }

      // ---------------------------------------------------------
      // 1. Get all chats for the logged-in user
      // ---------------------------------------------------------

      const chatsResponse = await fetch(`${API_URL}/api/chats`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const chatsData = await chatsResponse.json();

      if (!chatsResponse.ok) {
        throw new Error(chatsData?.error || "Failed to load chat information.");
      }

      const chats = chatsData?.chats || [];

      // ---------------------------------------------------------
      // 2. Find the current chat
      // ---------------------------------------------------------

      const currentChat = chats.find(
        (item) => String(item.CHAT_ID) === String(id),
      );

      if (!currentChat) {
        throw new Error("Chat information not found.");
      }

      setChat(currentChat);

      // ---------------------------------------------------------
      // 3. Fetch details conditionally based on CHAT_TYPE
      // ---------------------------------------------------------

      const chatType = currentChat.CHAT_TYPE || "DIRECT";

      if (chatType === "DIRECT") {
        const otherUserId = currentChat.OTHER_USER_ID;

        if (!otherUserId) {
          throw new Error("The other user's ID was not found.");
        }

        // Fetch complete profile of the other user
        const userResponse = await fetch(`${API_URL}/api/user/${otherUserId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
          throw new Error(userData?.error || "Failed to load user information.");
        }

        if (!userData?.user) {
          throw new Error("User information was not returned.");
        }

        setUser(userData.user);
      } else {
        // Group chat handling: Reset target user state as it's a group
        setUser(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load chat information.");
    } finally {
      setLoading(false);
    }
  }

  function getProfileImage() {
    if (chat?.CHAT_TYPE === "GROUP") {
      return null;
    }

    if (user?.profilePicture) {
      return {
        uri: user.profilePicture,
      };
    }

    if (chat?.OTHER_PROFILE_PICTURE) {
      return {
        uri: chat.OTHER_PROFILE_PICTURE,
      };
    }

    return null;
  }

  function handleAddMembers() {
    Alert.alert(
      "Add Members",
      "Navigate to member selection screen or open select user modal.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => {} },
      ]
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Info",
            headerBackTitleVisible: false,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.onBackground,
          }}
        />

        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            animating={true}
            color={colors.primary}
          />

          <Text
            style={[
              styles.loadingText,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            Loading information...
          </Text>
        </View>
      </>
    );
  }

  if (error || !chat) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Info",
            headerBackTitleVisible: false,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.onBackground,
          }}
        />

        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={50}
            color={colors.onSurfaceVariant}
          />

          <Text
            style={[
              styles.errorText,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            {error || "Chat information not found."}
          </Text>

          <Button
            mode="contained"
            onPress={loadChatInfo}
            style={styles.retryButton}
            contentStyle={styles.retryButtonContent}
          >
            Try Again
          </Button>
        </View>
      </>
    );
  }

  const isGroup = chat.CHAT_TYPE === "GROUP";

  const displayName = isGroup
    ? chat.TITLE || "Group Chat"
    : user?.fullName ||
      chat.DISPLAY_NAME ||
      chat.OTHER_FULL_NAME ||
      user?.username ||
      "Unknown User";

  const username = isGroup ? null : user?.username || chat.OTHER_USERNAME;
  const phoneNumber = isGroup ? null : user?.phoneNumber || null;
  const isOnline = isGroup
    ? false
    : user?.isOnline !== undefined
    ? user.isOnline
    : chat.OTHER_IS_ONLINE;

  return (
    <>
      <Stack.Screen
        options={{
          title: isGroup ? "Group Info" : "Info",
          headerBackTitleVisible: false,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.onBackground,
        }}
      />

      <ScrollView
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* =========================
            HEADER / PROFILE
        ========================= */}

        <Surface
          elevation={0}
          style={[
            styles.profileSection,
            {
              backgroundColor: colors.background,
            },
          ]}
        >
          {getProfileImage() ? (
            <Image source={getProfileImage()} style={styles.profileImage} />
          ) : (
            <View
              style={[
                styles.profileImage,
                {
                  backgroundColor: colors.surfaceVariant,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Ionicons
                name={isGroup ? "people" : "person"}
                size={55}
                color={colors.onSurfaceVariant}
              />
            </View>
          )}

          <Text
            style={[
              styles.name,
              {
                color: colors.onBackground,
              },
            ]}
          >
            {displayName}
          </Text>

          {username && (
            <Text
              style={[
                styles.username,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              @{username}
            </Text>
          )}

          {phoneNumber && (
            <Text
              style={[
                styles.phone,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              {phoneNumber}
            </Text>
          )}

          {!isGroup && (
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isOnline
                      ? "#34C759"
                      : colors.onSurfaceVariant,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusText,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          )}
        </Surface>

        {/* =========================
            GROUP MEMBERS SECTION (GROUP ONLY)
        ========================= */}

        {isGroup && (
          <>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Group Members
            </Text>

            <Surface
              elevation={1}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                },
              ]}
            >
              <Pressable
                style={styles.actionRow}
                onPress={handleAddMembers}
              >
                <Ionicons
                  name="person-add-outline"
                  size={24}
                  color={colors.primary}
                />

                <Text
                  style={[
                    styles.actionText,
                    {
                      color: colors.primary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  Add Members
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            </Surface>
          </>
        )}

        {/* =========================
            CHAT INFORMATION
        ========================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurfaceVariant,
            },
          ]}
        >
          Chat Information
        </Text>

        <Surface
          elevation={1}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View style={styles.infoRow}>
            <Ionicons
              name={isGroup ? "people-outline" : "person-outline"}
              size={24}
              color={colors.primary}
            />

            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoTitle,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                Chat Type
              </Text>

              <Text
                style={[
                  styles.infoValue,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                {chat.CHAT_TYPE || "DIRECT"}
              </Text>
            </View>
          </View>
        </Surface>

        {/* =========================
            MEDIA
        ========================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurfaceVariant,
            },
          ]}
        >
          Media, Links and Docs
        </Text>

        <Surface
          elevation={1}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Pressable
            style={styles.infoRow}
            onPress={() =>
              Alert.alert(
                "Media",
                "Media, links and documents will be added later.",
              )
            }
          >
            <Ionicons name="images-outline" size={24} color={colors.primary} />

            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoTitle,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                Media, Links and Docs
              </Text>

              <Text
                style={[
                  styles.infoValue,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                Not available yet
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        </Surface>

        {/* =========================
            CHAT OPTIONS
        ========================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurfaceVariant,
            },
          ]}
        >
          Chat Settings
        </Text>

        <Surface
          elevation={1}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Pressable
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                "Notifications",
                "Notification settings will be connected later.",
              )
            }
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.primary}
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              Notifications
            </Text>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>

          <View
            style={[
              styles.separator,
              {
                backgroundColor: colors.outlineVariant,
              },
            ]}
          />

          <Pressable
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                "Starred Messages",
                "Starred messages will be added later.",
              )
            }
          >
            <Ionicons name="star-outline" size={24} color={colors.primary} />

            <Text
              style={[
                styles.actionText,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              Starred Messages
            </Text>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>

          <View
            style={[
              styles.separator,
              {
                backgroundColor: colors.outlineVariant,
              },
            ]}
          />

          <Pressable
            style={styles.actionRow}
            onPress={() =>
              Alert.alert(
                "Wallpaper",
                "Wallpaper settings will be added later.",
              )
            }
          >
            <Ionicons
              name="color-palette-outline"
              size={24}
              color={colors.primary}
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: colors.onSurface,
                },
              ]}
            >
              Wallpaper
            </Text>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        </Surface>

        {/* =========================
            PRIVACY
        ========================= */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.onSurfaceVariant,
            },
          ]}
        >
          Privacy and Security
        </Text>

        <Surface
          elevation={1}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <View style={styles.infoRow}>
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color={colors.primary}
            />

            <View style={styles.infoContent}>
              <Text
                style={[
                  styles.infoTitle,
                  {
                    color: colors.onSurface,
                  },
                ]}
              >
                Encryption
              </Text>

              <Text
                style={[
                  styles.infoValue,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                Messages are protected.
              </Text>
            </View>
          </View>
        </Surface>

        {/* =========================
            DANGER
        ========================= */}

        <Surface
          elevation={1}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          {isGroup ? (
            <Pressable
              style={styles.actionRow}
              onPress={() =>
                Alert.alert("Exit Group", "Are you sure you want to exit?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Exit", style: "destructive", onPress: () => {} },
                ])
              }
            >
              <Ionicons name="log-out-outline" size={24} color="#D9534F" />

              <Text style={[styles.actionText, styles.dangerText]}>
                Exit Group
              </Text>
            </Pressable>
          ) : (
            <>
              <Pressable
                style={styles.actionRow}
                onPress={() =>
                  Alert.alert(
                    `Block ${displayName}?`,
                    "This will later create a BLOCKED_USER record.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Block",
                        style: "destructive",
                        onPress: () => {},
                      },
                    ],
                  )
                }
              >
                <Ionicons name="ban-outline" size={24} color="#D9534F" />

                <Text style={[styles.actionText, styles.dangerText]}>
                  Block {displayName}
                </Text>
              </Pressable>

              <View
                style={[
                  styles.separator,
                  {
                    backgroundColor: colors.outlineVariant,
                  },
                ]}
              />

              <Pressable
                style={styles.actionRow}
                onPress={() =>
                  Alert.alert(
                    "Report User",
                    "Reporting will be connected to the backend later.",
                  )
                }
              >
                <Ionicons name="flag-outline" size={24} color="#D9534F" />

                <Text style={[styles.actionText, styles.dangerText]}>
                  Report User
                </Text>
              </Pressable>
            </>
          )}
        </Surface>

        <Text
          style={[
            styles.footer,
            {
              color: colors.onSurfaceVariant,
            },
          ]}
        >
          End-to-end protected conversation
        </Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  contentContainer: {
    paddingBottom: 40,
  },

  profileSection: {
    alignItems: "center",
    paddingTop: 25,
    paddingBottom: 25,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 12,
  },

  name: {
    fontSize: 24,
    fontWeight: "600",
  },

  username: {
    fontSize: 15,
    marginTop: 3,
  },

  phone: {
    fontSize: 15,
    marginTop: 5,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 14,
    paddingHorizontal: 18,
    paddingTop: 25,
    paddingBottom: 8,
  },

  card: {
    marginHorizontal: 0,
    paddingHorizontal: 16,
    borderRadius: 0,
  },

  infoRow: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
  },

  infoContent: {
    flex: 1,
    marginLeft: 15,
  },

  infoTitle: {
    fontSize: 16,
  },

  infoValue: {
    fontSize: 13,
    marginTop: 3,
  },

  actionRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },

  actionText: {
    flex: 1,
    fontSize: 16,
  },

  dangerText: {
    color: "#D9534F",
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 40,
  },

  footer: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 25,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
  },

  retryButton: {
    marginTop: 20,
    borderRadius: 20,
  },

  retryButtonContent: {
    height: 42,
  },
});