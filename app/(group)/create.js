import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import {
    ActivityIndicator,
    Button,
    RadioButton,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
import { API_URL } from "../../constants/API";
import { getItem } from "../../utils/storage";

const SESSION_KEY = "user_session";

export default function CreateGroupPage() {
  const theme = useTheme();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState("WORK");
  const [loading, setLoading] = useState(false);

  /*
   * Get JWT session token
   */
  const getToken = async () => {
    const session = await getItem(SESSION_KEY);
    if (!session) return null;

    try {
      const parsed = JSON.parse(session);
      if (typeof parsed === "string") return parsed;
      return parsed.token || parsed.accessToken || parsed.jwt || null;
    } catch {
      return session;
    }
  };

  /*
   * Handle group creation request
   */
  const handleCreateGroup = async () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Group title is required.");
      return;
    }

    setLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        Alert.alert("Session Expired", "Please log in again.");
        return;
      }

      const response = await fetch(`${API_URL}/api/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          groupType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create group");
      }

      Alert.alert("Success", "Group created successfully!", [
        {
          text: "OK",
          onPress: () => {
            if (result.chatId) {
              router.replace(`/chats/${result.chatId}`);
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch (err) {
      console.error("Create group error:", err);
      Alert.alert("Error", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineSmall" style={styles.headerTitle}>
        Create New Group
      </Text>

      {/* Group Title */}
      <TextInput
        label="Group Title *"
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        placeholder="e.g. Project Alpha"
        style={styles.input}
      />

      {/* Group Description */}
      <TextInput
        label="Description (Optional)"
        value={description}
        onChangeText={setDescription}
        mode="outlined"
        multiline
        numberOfLines={3}
        placeholder="What is this group for?"
        style={styles.input}
      />

      {/* Group Type Radio Options */}
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Group Type
      </Text>

      <RadioButton.Group
        onValueChange={(newValue) => setGroupType(newValue)}
        value={groupType}
      >
        <View style={styles.radioOption}>
          <RadioButton value="WORK" />
          <Text variant="bodyLarge">Work</Text>
        </View>

        <View style={styles.radioOption}>
          <RadioButton value="STUDY" />
          <Text variant="bodyLarge">Study</Text>
        </View>
      </RadioButton.Group>

      {/* Action Buttons */}
      <Button
        mode="contained"
        onPress={handleCreateGroup}
        disabled={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.onPrimary} size="small" />
        ) : (
          "Create Group"
        )}
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
        disabled={loading}
        style={styles.cancelButton}
      >
        Cancel
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headerTitle: {
    fontWeight: "700",
    marginBottom: 20,
    marginTop: 10,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 8,
    fontWeight: "600",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  button: {
    marginTop: 24,
    borderRadius: 8,
  },
  buttonContent: {
    height: 48,
  },
  cancelButton: {
    marginTop: 8,
  },
});