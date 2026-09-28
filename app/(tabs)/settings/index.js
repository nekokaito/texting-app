import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";

import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Button,
  Dialog,
  List,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";

import { API_URL } from "../../../constants/API";
import Colors from "../../../constants/Colors";
import { getItem, removeItem } from "../../../utils/storage";

export default function SettingsPage() {
  const router = useRouter();
  const { colors } = useTheme();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Fetch the authenticated user's profile
  const fetchProfile = useCallback(async () => {
    try {
      setProfileError("");

      const sessionString = await getItem("user_session");

      if (!sessionString) {
        setProfileError("Please log in to view your profile.");
        return;
      }

      let session;

      try {
        session = JSON.parse(sessionString);
      } catch {
        setProfileError("Your session is invalid. Please log in again.");
        return;
      }

      const token = session?.token;

      if (!token) {
        setProfileError("Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setProfileError("Your session has expired. Please log in again.");
        } else {
          setProfileError(data.error || "Failed to load profile.");
        }

        return;
      }

      setProfile(data.user);
    } catch (error) {
      console.error("Fetch Profile Error:", error);
      setProfileError("Unable to connect to the server.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh profile
  const handleRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  // Logout
  const handleLogout = async () => {
    try {
      await removeItem("user_session");
      setLogoutVisible(false);
      router.replace("/welcome");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // Settings data using Material Community Icons
  const devices = [
    {
      name: "Broadcast Lists",
      icon: "bullhorn-outline",
      backgroundColor: Colors.green,
    },
    {
      name: "Starred Messages",
      icon: "star",
      backgroundColor: Colors.yellow,
    },
    {
      name: "Linked Devices",
      icon: "devices",
      backgroundColor: Colors.green,
    },
  ];

  const items = [
    {
      name: "Account",
      icon: "account-key-outline",
      backgroundColor: Colors.primary,
    },
    {
      name: "Privacy",
      icon: "lock-outline",
      backgroundColor: "#33A5D1",
    },
    {
      name: "Chats",
      icon: "whatsapp",
      backgroundColor: Colors.green,
    },
    {
      name: "Notifications",
      icon: "bell-outline",
      backgroundColor: Colors.red,
    },
    {
      name: "Storage and Data",
      icon: "database-outline",
      backgroundColor: Colors.green,
    },
  ];

  const support = [
    {
      name: "Help",
      icon: "help-circle-outline",
      backgroundColor: Colors.primary,
    },
    {
      name: "Tell a Friend",
      icon: "heart-outline",
      backgroundColor: Colors.red,
    },
  ];

  // Render a React Native Paper settings item
  const renderItem = (item) => (
    <List.Item
      key={item.name}
      title={item.name}
      titleStyle={{
        fontSize: 17,
        color: colors.onSurface,
      }}
      onPress={() => {
        // Add navigation for each setting when its screen is ready
      }}
      left={() => (
        <View
          style={[
            styles.iconBackground,
            { backgroundColor: item.backgroundColor },
          ]}
        >
          <List.Icon
            icon={item.icon}
            color="#FFFFFF"
            style={styles.settingIcon}
          />
        </View>
      )}
      right={() => (
        <List.Icon icon="chevron-right" color={colors.onSurfaceVariant} />
      )}
      style={styles.listItem}
    />
  );

  // Render a Paper section
  const renderSection = (data) => (
    <List.Section
      key={data[0]?.name}
      style={[
        styles.section,
        {
          backgroundColor: colors.surface,
        },
      ]}
    >
      {data.map((item, index) => (
        <View key={item.name}>
          {renderItem(item)}

          {index !== data.length - 1 && (
            <View
              style={[
                styles.separator,
                {
                  backgroundColor: colors.outlineVariant,
                },
              ]}
            />
          )}
        </View>
      ))}
    </List.Section>
  );

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Profile Section */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              // Navigate to the profile screen when available
            }}
            style={[
              styles.profileContainer,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />

                <Text
                  style={[
                    styles.loadingText,
                    {
                      color: colors.onSurfaceVariant,
                    },
                  ]}
                >
                  Loading profile...
                </Text>
              </View>
            ) : profile ? (
              <View style={styles.profileContent}>
                {profile.profilePicture ? (
                  <Image
                    source={{
                      uri: profile.profilePicture,
                    }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View
                    style={[
                      styles.profilePlaceholder,
                      {
                        backgroundColor: colors.surfaceVariant,
                      },
                    ]}
                  >
                    <List.Icon
                      icon="account-outline"
                      color={colors.onSurfaceVariant}
                      style={styles.profilePlaceholderIcon}
                    />
                  </View>
                )}

                <View style={styles.profileInfo}>
                  <Text
                    variant="titleMedium"
                    numberOfLines={1}
                    style={[
                      styles.fullName,
                      {
                        color: colors.onSurface,
                      },
                    ]}
                  >
                    {profile.fullName || "Texting User"}
                  </Text>

                  <Text
                    variant="bodyMedium"
                    numberOfLines={1}
                    style={{
                      color: colors.onSurfaceVariant,
                    }}
                  >
                    @{profile.username || "username"}
                  </Text>
                </View>

                <List.Icon
                  icon="chevron-right"
                  color={colors.onSurfaceVariant}
                />
              </View>
            ) : (
              <View style={styles.errorContainer}>
                <List.Icon icon="alert-circle-outline" color={colors.error} />

                <Text
                  style={[
                    styles.errorText,
                    {
                      color: colors.onSurface,
                    },
                  ]}
                >
                  {profileError || "Unable to load profile."}
                </Text>

                <Button onPress={fetchProfile}>Retry</Button>
              </View>
            )}
          </TouchableOpacity>

          {/* Devices */}
          {renderSection(devices)}

          {/* Settings */}
          {renderSection(items)}

          {/* Support */}
          {renderSection(support)}

          {/* Media Testing Buttons
          <Button
            mode="contained"
            style={styles.mediaButton}
            onPress={() => router.push("/media-document-test")}
          >
            Upload document test
          </Button>

          <Button
            mode="contained"
            style={styles.mediaButton}
            onPress={() => router.push("/media-test")}
          >
            Upload photo/video test
          </Button> */}

          {/* Logout */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setLogoutVisible(true)}
          >
            <Text
              style={[
                styles.logoutText,
                {
                  color: colors.primary,
                },
              ]}
            >
              Log Out
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={logoutVisible}
          onDismiss={() => setLogoutVisible(false)}
        >
          <Dialog.Title>Log out?</Dialog.Title>

          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to log out of your account?
            </Text>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setLogoutVisible(false)}>Cancel</Button>

            <Button onPress={handleLogout}>Log Out</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  profileContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
  },

  profileContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  profileImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E0E0E0",
  },

  profilePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  profilePlaceholderIcon: {
    margin: 0,
  },

  profileInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },

  fullName: {
    fontWeight: "600",
    marginBottom: 4,
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },

  loadingText: {
    marginTop: 10,
  },

  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  errorText: {
    textAlign: "center",
    marginTop: 8,
  },

  section: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: "hidden",
  },

  listItem: {
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 4,
  },

  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
    alignSelf: "center",
  },

  settingIcon: {
    margin: 0,
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },

  mediaButton: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },

  logoutText: {
    fontSize: 18,
    textAlign: "center",
    paddingVertical: 14,
  },
});
