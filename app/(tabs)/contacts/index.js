import {
  Contact,
  ContactField,
  ContactsSortOrder,
  requestPermissionsAsync,
} from "expo-contacts";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  View,
} from "react-native";
import {
  Avatar,
  Button,
  Divider,
  Icon,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import { API_URL } from "../../../constants/API";
import { getItem } from "../../../utils/storage";

const SESSION_KEY = "user_session";

const INVITE_MESSAGE =
  "Hey! I'm using Texting App to chat with friends. Join me here: https://your-app-link.com";

export default function ContactsPage() {
  const theme = useTheme();
  const router = useRouter();

  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState("");

  /*
   * Get authentication token from existing session.
   */
  const getToken = async () => {
    const session = await getItem(SESSION_KEY);

    if (!session) {
      return null;
    }

    try {
      const parsed = JSON.parse(session);

      if (typeof parsed === "string") {
        return parsed;
      }

      return parsed.token || parsed.accessToken || parsed.jwt || null;
    } catch {
      return session;
    }
  };

  /*
   * Normalize phone numbers for frontend matching.
   */
  const normalizePhone = (phone) => {
    if (!phone) {
      return "";
    }

    return phone.replace(/[^\d+]/g, "").replace(/^00/, "+");
  };

  /*
   * Load phone contacts and registered users.
   */
  const loadContacts = useCallback(async () => {
    try {
      setError("");

      /*
       * Request Contacts permission.
       */
      const { status } = await requestPermissionsAsync();

      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }

      setPermissionDenied(false);

      /*
       * Get device contacts.
       */
      const phoneContacts = await Contact.getAllDetails(
        [ContactField.FULL_NAME, ContactField.PHONES, ContactField.IMAGE],
        {
          sortOrder: ContactsSortOrder.GivenName,
        },
      );

      /*
       * Convert device contacts into our format.
       */
      const deviceContacts = phoneContacts
        .filter((contact) => contact.phones && contact.phones.length > 0)
        .map((contact) => {
          const phone = contact.phones?.[0]?.number || "";

          const imageUri =
            typeof contact.image === "string"
              ? contact.image
              : contact.image?.uri || null;

          return {
            id: contact.id,
            name: contact.fullName || "Unknown",
            phone,
            normalizedPhone: normalizePhone(phone),
            imageUri,
          };
        })
        .filter((contact) => contact.phone);

      /*
       * Get JWT.
       */
      const token = await getToken();

      if (!token) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      /*
       * Sync contacts with backend.
       *
       * Only registered users are stored
       * in the CONTACTS table by the backend.
       */
      if (deviceContacts.length > 0) {
        try {
          const syncResponse = await fetch(`${API_URL}/api/contacts/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              phoneNumbers: deviceContacts.map((contact) => ({
                phoneNumber: contact.phone,
                savedName: contact.name,
              })),
            }),
          });

          if (!syncResponse.ok) {
            const syncData = await syncResponse.json().catch(() => ({}));

            console.log("Contact sync failed:", syncData);
          }
        } catch (syncError) {
          console.log("Contact sync error:", syncError);
        }
      }

      /*
       * Get registered contacts from backend.
       */
      const response = await fetch(`${API_URL}/api/contacts`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch contacts");
      }

      const registeredContacts = result.contacts || [];

      /*
       * Create lookup:
       *
       * phone number -> registered app user
       */
      const registeredMap = new Map();

      registeredContacts.forEach((contact) => {
        const phone = normalizePhone(contact.PHONE_NUMBER);

        if (phone) {
          registeredMap.set(phone, contact);
        }
      });

      /*
       * Merge device contacts with registered users.
       */
      const mergedContacts = deviceContacts.map((deviceContact) => {
        const registeredUser = registeredMap.get(deviceContact.normalizedPhone);

        if (registeredUser) {
          return {
            ...deviceContact,
            registered: true,
            user: registeredUser,
          };
        }

        return {
          ...deviceContact,
          registered: false,
          user: null,
        };
      });

      setContacts(mergedContacts);
    } catch (err) {
      console.error("Contact loading error:", err);

      setError(err.message || "Failed to load contacts");
    }
  }, []);

  /*
   * Initial load.
   */
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      try {
        await loadContacts();
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [loadContacts]);

  /*
   * Pull to refresh.
   */
  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadContacts();
    } finally {
      setRefreshing(false);
    }
  };

  /*
   * Invite unregistered contact by SMS.
   */
  const inviteContact = async (contact) => {
    if (!contact.phone) {
      return;
    }

    const smsUrl =
      `sms:${contact.phone}` + `?body=${encodeURIComponent(INVITE_MESSAGE)}`;

    try {
      const supported = await Linking.canOpenURL(smsUrl);

      if (!supported) {
        console.log("SMS is not available on this device");
        return;
      }

      await Linking.openURL(smsUrl);
    } catch (err) {
      console.error("Open SMS error:", err);
    }
  };

  /*
   * Open registered user's chat.
   */
  const openRegisteredContact = async (contact) => {
    try {
      const user = contact.user;

      const recipientId =
        user?.CONTACT_USER_ID ??
        user?.USER_ID ??
        user?.userId ??
        user?.user_id ??
        user?.id;

      if (!recipientId) {
        Alert.alert("Error", "Could not find this user's ID.");
        return;
      }

      const token = await getToken();

      if (!token) {
        Alert.alert("Session expired", "Please log in again to send messages.");
        return;
      }

      const response = await fetch(`${API_URL}/api/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: Number(recipientId),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not open chat.");
      }

      const chatId = result.chatId ?? result.CHAT_ID;

      if (!chatId) {
        throw new Error("The server did not return a chat ID.");
      }

      router.push(`/chats/${chatId}`);
    } catch (err) {
      console.error("Open chat error:", err);

      Alert.alert(
        "Unable to open chat",
        err.message || "Something went wrong. Please try again.",
      );
    }
  };

  /*
   * Search contacts.
   */
  const filteredContacts = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    if (!searchText) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const name = contact.name?.toLowerCase() || "";

      const phone = contact.phone?.toLowerCase() || "";

      const username = contact.user?.USERNAME?.toLowerCase() || "";

      return (
        name.includes(searchText) ||
        phone.includes(searchText) ||
        username.includes(searchText)
      );
    });
  }, [contacts, search]);

  /*
   * Separate contacts into two sections.
   */
  const sections = useMemo(() => {
    const registeredContacts = filteredContacts.filter(
      (contact) => contact.registered,
    );

    const unregisteredContacts = filteredContacts.filter(
      (contact) => !contact.registered,
    );

    const result = [];

    if (registeredContacts.length > 0) {
      result.push({
        title: "Contacts on Texting",
        data: registeredContacts,
      });
    }

    if (unregisteredContacts.length > 0) {
      result.push({
        title: "Invite to Texting",
        data: unregisteredContacts,
      });
    }

    return result;
  }, [filteredContacts]);

  /*
   * Contact row.
   */
  const renderContact = ({ item }) => {
    const registeredUser = item.user;

    // Registered user's profile picture takes priority.
    const imageUri = registeredUser?.PROFILE_PICTURE || item.imageUri || null;

    // Show the name saved in the phone book.
    const displayName = item.name || registeredUser?.USERNAME || "Unknown";

    const phone = registeredUser?.PHONE_NUMBER || item.phone || "";
    const username = registeredUser?.USERNAME;

    return (
      <>
        <Pressable
          style={styles.contactRow}
          onPress={() => {
            if (item.registered) {
              openRegisteredContact(item);
            }
          }}
          disabled={!item.registered}
        >
          {imageUri ? (
            <Avatar.Image size={52} source={{ uri: imageUri }} />
          ) : (
            <Avatar.Text
              size={52}
              label={getInitials(displayName)}
              style={{
                backgroundColor: theme.colors.primaryContainer,
              }}
              color={theme.colors.onPrimaryContainer}
            />
          )}

          <View style={styles.contactInfo}>
            <Text
              variant="titleMedium"
              numberOfLines={1}
              style={styles.contactName}
            >
              {displayName}
            </Text>

            <Text
              variant="bodyMedium"
              numberOfLines={1}
              style={[
                styles.phoneNumber,
                {
                  color: theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {item.registered && username ? `@${username} • ${phone}` : phone}
            </Text>
          </View>

          {item.registered ? (
            <Icon
              source="chevron-right"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          ) : (
            <Button
              mode="outlined"
              compact
              onPress={() => inviteContact(item)}
              style={styles.inviteButton}
              contentStyle={styles.inviteButtonContent}
              labelStyle={styles.inviteButtonLabel}
            >
              Invite
            </Button>
          )}
        </Pressable>

        <Divider style={styles.divider} />
      </>
    );
  };

  /*
   * Section header.
   */
  const renderSectionHeader = ({ section }) => {
    return (
      <View
        style={[
          styles.sectionHeader,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Text
          variant="titleMedium"
          style={[
            styles.sectionTitle,
            {
              color: theme.colors.onBackground,
            },
          ]}
        >
          {section.title}
        </Text>

        <Text
          variant="labelMedium"
          style={[
            styles.sectionCount,
            {
              color: theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {section.data.length}
        </Text>
      </View>
    );
  };

  /*
   * Permission denied.
   */
  if (permissionDenied) {
    return (
      <View
        style={[
          styles.centerContainer,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Avatar.Icon
          size={72}
          icon="account-multiple-outline"
          style={{
            backgroundColor: theme.colors.secondaryContainer,
          }}
          color={theme.colors.onSecondaryContainer}
        />

        <Text variant="headlineSmall" style={styles.permissionTitle}>
          Contacts Permission Required
        </Text>

        <Text
          variant="bodyLarge"
          style={[
            styles.permissionText,
            {
              color: theme.colors.onSurfaceVariant,
            },
          ]}
        >
          Allow the app to access your phone contacts to find friends who are
          already using the app.
        </Text>

        <Button
          mode="contained"
          icon="account-multiple"
          onPress={loadContacts}
          style={styles.permissionButton}
          contentStyle={styles.permissionButtonContent}
        >
          Allow Contacts
        </Button>
      </View>
    );
  }

  /*
   * Loading.
   */
  if (loading) {
    return (
      <View
        style={[
          styles.centerContainer,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />

        <Text
          variant="bodyLarge"
          style={[
            styles.loadingText,
            {
              color: theme.colors.onSurfaceVariant,
            },
          ]}
        >
          Loading contacts...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <Searchbar
        value={search}
        onChangeText={setSearch}
        placeholder="Search contacts"
        mode="bar"
        elevation={0}
        style={[
          styles.searchBar,
          {
            backgroundColor: theme.colors.surfaceVariant,
          },
        ]}
        inputStyle={styles.searchInput}
        iconColor={theme.colors.onSurfaceVariant}
        placeholderTextColor={theme.colors.onSurfaceVariant}
      />

      <View style={styles.countContainer}>
        <Text
          variant="labelLarge"
          style={{
            color: theme.colors.onSurfaceVariant,
          }}
        >
          {filteredContacts.length}{" "}
          {filteredContacts.length === 1 ? "Contact" : "Contacts"}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text
            variant="bodyMedium"
            style={{
              color: theme.colors.error,
            }}
          >
            {error}
          </Text>

          <Button mode="text" compact onPress={loadContacts}>
            Retry
          </Button>
        </View>
      ) : null}

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderContact}
        renderSectionHeader={renderSectionHeader}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={
          filteredContacts.length === 0
            ? styles.emptyListContainer
            : styles.listContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Avatar.Icon
              size={64}
              icon="account-search-outline"
              style={{
                backgroundColor: theme.colors.surfaceVariant,
              }}
              color={theme.colors.onSurfaceVariant}
            />

            <Text variant="titleMedium" style={styles.emptyTitle}>
              No contacts found
            </Text>

            <Text
              variant="bodyMedium"
              style={[
                styles.emptyText,
                {
                  color: theme.colors.onSurfaceVariant,
                },
              ]}
            >
              Try searching with a different name or phone number.
            </Text>
          </View>
        }
      />
    </View>
  );
}

/*
 * Get initials for avatar.
 */
function getInitials(name) {
  if (!name) {
    return "?";
  }

  const words = name.trim().split(/\s+/);

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  searchBar: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    height: 50,
  },

  searchInput: {
    fontSize: 16,
  },

  countContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },

  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionTitle: {
    fontWeight: "600",
    flex: 1,
  },

  sectionCount: {
    marginLeft: 8,
  },

  listContainer: {
    paddingBottom: 30,
  },

  contactRow: {
    minHeight: 72,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  contactInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },

  contactName: {
    fontWeight: "500",
  },

  phoneNumber: {
    marginTop: 2,
  },

  divider: {
    marginLeft: 86,
  },

  inviteButton: { borderRadius: 18, minWidth: 72, borderWidth: 1 },
  inviteButtonContent: { height: 34, paddingHorizontal: 4 },
  inviteButtonLabel: { fontSize: 13, lineHeight: 16, marginHorizontal: 4 },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  permissionTitle: {
    textAlign: "center",
    marginTop: 20,
  },

  permissionText: {
    textAlign: "center",
    lineHeight: 24,
    marginTop: 10,
  },

  permissionButton: {
    marginTop: 24,
    borderRadius: 20,
  },

  permissionButtonContent: {
    height: 44,
  },

  loadingText: {
    marginTop: 14,
  },

  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 8,
    alignItems: "center",
  },

  emptyListContainer: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 80,
  },

  emptyTitle: {
    marginTop: 16,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 6,
    lineHeight: 21,
  },
});
