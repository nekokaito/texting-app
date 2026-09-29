import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [userRole, setUserRole] = useState("MEMBER");
  const [error, setError] = useState(null);

  // Notices & Assignments State
  const [notices, setNotices] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Modals & Forms State
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeAttachment, setNoticeAttachment] = useState(null);

  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDesc, setAssignmentDesc] = useState("");

  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Admin View Submissions State
  const [adminSubmissionsModalVisible, setAdminSubmissionsModalVisible] = useState(false);
  const [currentSubmissions, setCurrentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

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
      const currentUserId = session.userId || session.user?.userId;

      if (!token) {
        setError("No authentication token was found.");
        setLoading(false);
        return;
      }

      // 1. Get chats
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

      // 2. Find current chat
      const currentChat = chats.find(
        (item) => String(item.CHAT_ID) === String(id)
      );

      if (!currentChat) {
        throw new Error("Chat information not found.");
      }

      setChat(currentChat);

      // 3. Conditional User / Member details
      const chatType = currentChat.CHAT_TYPE || "DIRECT";

      if (chatType === "DIRECT") {
        const otherUserId = currentChat.OTHER_USER_ID;

        if (!otherUserId) {
          throw new Error("The other user's ID was not found.");
        }

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
        setUser(null);
        // Fetch group role
        const membersRes = await fetch(`${API_URL}/api/chats/${id}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          const me = (membersData.members || []).find(
            (m) => String(m.userId) === String(currentUserId)
          );
          if (me) setUserRole(me.role);
        }
      }

      // Load Notices and Assignments
      fetchNotices(token);
      fetchAssignments(token);

    } catch (err) {
      setError(err.message || "Failed to load chat information.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNotices(tokenOverride) {
    try {
      const storedSession = await getItem("user_session");
      const token = tokenOverride || JSON.parse(storedSession)?.token;
      const res = await fetch(`${API_URL}/api/chats/${id}/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotices(data.notices || []);
      }
    } catch (err) {
      console.error("Fetch notices error:", err);
    }
  }

  async function fetchAssignments(tokenOverride) {
    try {
      const storedSession = await getItem("user_session");
      const token = tokenOverride || JSON.parse(storedSession)?.token;
      const res = await fetch(`${API_URL}/api/chats/${id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (err) {
      console.error("Fetch assignments error:", err);
    }
  }

  const pickDocument = async (setFileState) => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        setFileState(res.assets[0]);
      }
    } catch (err) {
      console.error("Document picking error:", err);
    }
  };

  const handleOpenFile = async (fileUrl) => {
    if (!fileUrl) {
      Alert.alert("Error", "File URL is not available.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert("Error", "Cannot open or download this file format on your device.");
      }
    } catch (err) {
      Alert.alert("Error", "Unable to open file.");
    }
  };

  async function handleCreateNotice() {
    if (!noticeTitle || !noticeContent) {
      Alert.alert("Error", "Title and content are required.");
      return;
    }

    try {
      const storedSession = await getItem("user_session");
      const token = JSON.parse(storedSession)?.token;

      const formData = new FormData();
      formData.append("title", noticeTitle);
      formData.append("content", noticeContent);

      if (noticeAttachment) {
        formData.append("files", {
          uri: noticeAttachment.uri,
          name: noticeAttachment.name,
          type: noticeAttachment.mimeType || "application/octet-stream",
        });
      }

      const res = await fetch(`${API_URL}/api/chats/${id}/notices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });

      if (res.ok) {
        setNoticeModalVisible(false);
        setNoticeTitle("");
        setNoticeContent("");
        setNoticeAttachment(null);
        fetchNotices();
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.error || "Failed to create notice.");
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred.");
    }
  }

  async function handleCreateAssignment() {
    if (!assignmentTitle) {
      Alert.alert("Error", "Assignment title is required.");
      return;
    }

    try {
      const storedSession = await getItem("user_session");
      const token = JSON.parse(storedSession)?.token;

      const res = await fetch(`${API_URL}/api/chats/${id}/assignments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: assignmentTitle,
          description: assignmentDesc,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      if (res.ok) {
        setAssignmentModalVisible(false);
        setAssignmentTitle("");
        setAssignmentDesc("");
        fetchAssignments();
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.error || "Failed to create assignment.");
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred.");
    }
  }

  async function handleSubmitAssignment() {
    if (!submissionFile) {
      Alert.alert("Error", "Please select a file to submit.");
      return;
    }

    try {
      setSubmitting(true);
      const storedSession = await getItem("user_session");
      const token = JSON.parse(storedSession)?.token;

      const formData = new FormData();
      formData.append("note", submissionNote);
      formData.append("file", {
        uri: submissionFile.uri,
        name: submissionFile.name,
        type: submissionFile.mimeType || "application/octet-stream",
      });

      const res = await fetch(
        `${API_URL}/api/assignments/${selectedAssignment.assignmentId}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        }
      );

      if (res.ok) {
        setSubmissionModalVisible(false);
        setSubmissionFile(null);
        setSubmissionNote("");
        fetchAssignments();
      } else {
        const errData = await res.json();
        Alert.alert("Error", errData.error || "Failed to submit assignment.");
      }
    } catch (err) {
      Alert.alert("Error", "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleViewSubmissions = async (assignmentId) => {
    try {
      setLoadingSubmissions(true);
      setAdminSubmissionsModalVisible(true);

      const storedSession = await getItem("user_session");
      const token = JSON.parse(storedSession)?.token;

      const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentSubmissions(data.submissions || []);
      } else {
        Alert.alert("Error", "Failed to fetch student submissions.");
      }
    } catch (err) {
      Alert.alert("Error", "An error occurred while fetching submissions.");
    } finally {
      setLoadingSubmissions(false);
    }
  };

  function getProfileImage() {
    if (chat?.CHAT_TYPE === "GROUP") return null;
    if (user?.profilePicture) return { uri: user.profilePicture };
    if (chat?.OTHER_PROFILE_PICTURE) return { uri: chat.OTHER_PROFILE_PICTURE };
    return null;
  }

  function handleAddMembers() {
    router.push({
      pathname: "/chats/add-members",
      params: { chatId: id },
    });
  }

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            title: "Info",
            headerBackTitleVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.onBackground,
          }}
        />
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" animating={true} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
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
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.onBackground,
          }}
        />
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Ionicons name="alert-circle-outline" size={50} color={colors.onSurfaceVariant} />
          <Text style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
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
  const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

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
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.onBackground,
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER / PROFILE */}
        <Surface elevation={0} style={[styles.profileSection, { backgroundColor: colors.background }]}>
          {getProfileImage() ? (
            <Image source={getProfileImage()} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, { backgroundColor: colors.surfaceVariant, alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name={isGroup ? "people" : "person"} size={55} color={colors.onSurfaceVariant} />
            </View>
          )}

          <Text style={[styles.name, { color: colors.onBackground }]}>{displayName}</Text>

          {username && (
            <Text style={[styles.username, { color: colors.onSurfaceVariant }]}>
              @{username}
            </Text>
          )}

          {phoneNumber && (
            <Text style={[styles.phone, { color: colors.onSurfaceVariant }]}>
              {phoneNumber}
            </Text>
          )}

          {!isGroup && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? "#34C759" : colors.onSurfaceVariant }]} />
              <Text style={[styles.statusText, { color: colors.onSurfaceVariant }]}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          )}
        </Surface>

        {/* GROUP MEMBERS */}
        {isGroup && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Group Members</Text>
            <Surface elevation={1} style={[styles.card, { backgroundColor: colors.surface }]}>
              <Pressable style={styles.actionRow} onPress={handleAddMembers}>
                <Ionicons name="person-add-outline" size={24} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary, fontWeight: "600" }]}>Add Members</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
              </Pressable>
            </Surface>
          </>
        )}

        {/* NOTICES & ANNOUNCEMENTS */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Notices & Announcements</Text>
          {isAdmin && (
            <Button compact mode="text" onPress={() => setNoticeModalVisible(true)}>
              + Add Notice
            </Button>
          )}
        </View>

        <Surface elevation={1} style={[styles.card, { backgroundColor: colors.surface }]}>
          {notices.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No notices posted yet.</Text>
          ) : (
            notices.map((item, index) => (
              <View key={item.noticeId || index}>
                {index > 0 && <View style={[styles.separator, { backgroundColor: colors.outlineVariant }]} />}
                <View style={styles.itemContainer}>
                  <Text style={[styles.itemTitle, { color: colors.onSurface }]}>{item.title}</Text>
                  <Text style={[styles.itemBody, { color: colors.onSurfaceVariant }]}>{item.content}</Text>
                  
                  {item.attachments && item.attachments.map((att, attIdx) => (
                    <Pressable
                      key={att.attachmentId || attIdx}
                      style={styles.attachmentBadge}
                      onPress={() => handleOpenFile(att.filePath || att.fileUrl)}
                    >
                      <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
                      <Text style={[styles.attachmentText, { color: colors.primary }]}>
                        {att.fileName || "View Attachment"}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
        </Surface>

        {/* ASSIGNMENTS */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Assignments</Text>
          {isAdmin && (
            <Button compact mode="text" onPress={() => setAssignmentModalVisible(true)}>
              + Create Assignment
            </Button>
          )}
        </View>

        <Surface elevation={1} style={[styles.card, { backgroundColor: colors.surface }]}>
          {assignments.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>No assignments assigned.</Text>
          ) : (
            assignments.map((item, index) => (
              <View key={item.assignmentId || index}>
                {index > 0 && <View style={[styles.separator, { backgroundColor: colors.outlineVariant }]} />}
                <View style={styles.itemContainer}>
                  <Text style={[styles.itemTitle, { color: colors.onSurface }]}>{item.title}</Text>
                  {!!item.description && (
                    <Text style={[styles.itemBody, { color: colors.onSurfaceVariant }]}>{item.description}</Text>
                  )}

                  {isAdmin ? (
                    <Button
                      mode="contained-tonal"
                      compact
                      style={{ marginTop: 8, alignSelf: "flex-start" }}
                      onPress={() => handleViewSubmissions(item.assignmentId)}
                    >
                      View Submissions
                    </Button>
                  ) : item.userSubmission ? (
                    <Pressable
                      style={styles.submissionInfo}
                      onPress={() => handleOpenFile(item.userSubmission.fileUrl || item.userSubmission.filePath)}
                    >
                      <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                      <Text style={styles.submittedText}>
                        Submitted: {item.userSubmission.fileName} (Tap to open)
                      </Text>
                    </Pressable>
                  ) : (
                    <Button
                      mode="outlined"
                      compact
                      style={{ marginTop: 8, alignSelf: "flex-start" }}
                      onPress={() => {
                        setSelectedAssignment(item);
                        setSubmissionModalVisible(true);
                      }}
                    >
                      Submit Assignment
                    </Button>
                  )}
                </View>
              </View>
            ))
          )}
        </Surface>

        {/* CHAT INFORMATION */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Chat Information</Text>
        <Surface elevation={1} style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Ionicons name={isGroup ? "people-outline" : "person-outline"} size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.onSurface }]}>Chat Type</Text>
              <Text style={[styles.infoValue, { color: colors.onSurfaceVariant }]}>
                {chat.CHAT_TYPE || "DIRECT"}
              </Text>
            </View>
          </View>
        </Surface>

        {/* MEDIA */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Media, Links and Docs</Text>
        <Surface elevation={1} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Pressable
            style={styles.infoRow}
            onPress={() => Alert.alert("Media", "Media, links and documents will be added later.")}
          >
            <Ionicons name="images-outline" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.onSurface }]}>Media, Links and Docs</Text>
              <Text style={[styles.infoValue, { color: colors.onSurfaceVariant }]}>Not available yet</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </Surface>

        {/* CHAT OPTIONS */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Chat Settings</Text>
        <Surface elevation={1} style={[styles.card, { backgroundColor: colors.surface }]}>
          <Pressable
            style={styles.actionRow}
            onPress={() => Alert.alert("Notifications", "Notification settings will be connected later.")}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.onSurface }]}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.outlineVariant }]} />

          <Pressable
            style={styles.actionRow}
            onPress={() => Alert.alert("Starred Messages", "Starred messages will be added later.")}
          >
            <Ionicons name="star-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.onSurface }]}>Starred Messages</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.outlineVariant }]} />

          <Pressable
            style={styles.actionRow}
            onPress={() => Alert.alert("Wallpaper", "Wallpaper settings will be added later.")}
          >
            <Ionicons name="color-palette-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.onSurface }]}>Wallpaper</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </Surface>

        {/* PRIVACY */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>Privacy and Security</Text>
        <Surface elevation={1} style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.primary} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoTitle, { color: colors.onSurface }]}>Encryption</Text>
              <Text style={[styles.infoValue, { color: colors.onSurfaceVariant }]}>Messages are protected.</Text>
            </View>
          </View>
        </Surface>

        {/* DANGER SECTION */}
        <Surface elevation={1} style={[styles.card, { backgroundColor: colors.surface }]}>
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
              <Text style={[styles.actionText, styles.dangerText]}>Exit Group</Text>
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
                      { text: "Cancel", style: "cancel" },
                      { text: "Block", style: "destructive", onPress: () => {} },
                    ]
                  )
                }
              >
                <Ionicons name="ban-outline" size={24} color="#D9534F" />
                <Text style={[styles.actionText, styles.dangerText]}>Block {displayName}</Text>
              </Pressable>

              <View style={[styles.separator, { backgroundColor: colors.outlineVariant }]} />

              <Pressable
                style={styles.actionRow}
                onPress={() => Alert.alert("Report User", "Reporting will be connected to the backend later.")}
              >
                <Ionicons name="flag-outline" size={24} color="#D9534F" />
                <Text style={[styles.actionText, styles.dangerText]}>Report User</Text>
              </Pressable>
            </>
          )}
        </Surface>

        <Text style={[styles.footer, { color: colors.onSurfaceVariant }]}>
          End-to-end protected conversation
        </Text>
      </ScrollView>

      {/* CREATE NOTICE MODAL */}
      <Modal visible={noticeModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>New Notice</Text>
            <TextInput
              placeholder="Title"
              placeholderTextColor={colors.onSurfaceVariant}
              value={noticeTitle}
              onChangeText={setNoticeTitle}
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outline }]}
            />
            <TextInput
              placeholder="Notice details..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={noticeContent}
              onChangeText={setNoticeContent}
              multiline
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, height: 80 }]}
            />

            <Button mode="outlined" icon="paperclip" onPress={() => pickDocument(setNoticeAttachment)}>
              {noticeAttachment ? noticeAttachment.name : "Attach Document"}
            </Button>

            <View style={styles.modalButtons}>
              <Button onPress={() => setNoticeModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleCreateNotice}>Publish</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE ASSIGNMENT MODAL */}
      <Modal visible={assignmentModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>New Assignment</Text>
            <TextInput
              placeholder="Assignment Title"
              placeholderTextColor={colors.onSurfaceVariant}
              value={assignmentTitle}
              onChangeText={setAssignmentTitle}
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outline }]}
            />
            <TextInput
              placeholder="Instructions..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={assignmentDesc}
              onChangeText={setAssignmentDesc}
              multiline
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, height: 80 }]}
            />

            <View style={styles.modalButtons}>
              <Button onPress={() => setAssignmentModalVisible(false)}>Cancel</Button>
              <Button mode="contained" onPress={handleCreateAssignment}>Post</Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* SUBMIT ASSIGNMENT MODAL */}
      <Modal visible={submissionModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Submit Assignment</Text>
            <Text style={{ marginBottom: 10, color: colors.onSurfaceVariant }}>
              {selectedAssignment?.title}
            </Text>

            <Button mode="outlined" icon="upload" onPress={() => pickDocument(setSubmissionFile)}>
              {submissionFile ? submissionFile.name : "Select File"}
            </Button>

            <TextInput
              placeholder="Notes for instructor (optional)"
              placeholderTextColor={colors.onSurfaceVariant}
              value={submissionNote}
              onChangeText={setSubmissionNote}
              style={[styles.input, { color: colors.onSurface, borderColor: colors.outline, marginTop: 12 }]}
            />

            <View style={styles.modalButtons}>
              <Button onPress={() => setSubmissionModalVisible(false)}>Cancel</Button>
              <Button mode="contained" loading={submitting} onPress={handleSubmitAssignment}>
                Submit
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* ADMIN SUBMISSIONS MODAL */}
      <Modal visible={adminSubmissionsModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: "80%" }]}>
            <Text style={[styles.modalTitle, { color: colors.onSurface }]}>Student Submissions</Text>

            {loadingSubmissions ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
            ) : currentSubmissions.length === 0 ? (
              <Text style={{ marginVertical: 15, color: colors.onSurfaceVariant }}>
                No submissions received yet.
              </Text>
            ) : (
              <ScrollView style={{ marginVertical: 10 }}>
                {currentSubmissions.map((sub, idx) => (
                  <View key={sub.submissionId || idx} style={{ marginBottom: 12 }}>
                    {idx > 0 && <View style={[styles.separator, { backgroundColor: colors.outlineVariant, marginBottom: 8 }]} />}
                    <Text style={{ fontWeight: "bold", color: colors.onSurface }}>
                      {sub.studentName || sub.userName || "Student"}
                    </Text>
                    {!!sub.note && (
                      <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginVertical: 2 }}>
                        Note: {sub.note}
                      </Text>
                    )}
                    <Pressable
                      style={[styles.attachmentBadge, { marginTop: 4 }]}
                      onPress={() => handleOpenFile(sub.fileUrl || sub.filePath)}
                    >
                      <Ionicons name="download-outline" size={18} color={colors.primary} />
                      <Text style={[styles.attachmentText, { color: colors.primary }]}>
                        {sub.fileName || "Download Submission"}
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <Button onPress={() => setAdminSubmissionsModalVisible(false)}>Close</Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, fontSize: 15 },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  errorText: { fontSize: 16, textAlign: "center", marginTop: 15 },
  retryButton: { marginTop: 20, borderRadius: 20 },
  retryButtonContent: { height: 42 },
  profileSection: { alignItems: "center", paddingTop: 25, paddingBottom: 25 },
  profileImage: { width: 110, height: 110, borderRadius: 55, marginBottom: 12 },
  name: { fontSize: 24, fontWeight: "600" },
  username: { fontSize: 15, marginTop: 3 },
  phone: { fontSize: 15, marginTop: 5 },
  statusContainer: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 13 },
  sectionHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: 10,
    paddingTop: 15,
  },
  sectionTitle: { fontSize: 14, paddingHorizontal: 18, paddingTop: 15, paddingBottom: 8 },
  card: { marginHorizontal: 0, paddingHorizontal: 16, borderRadius: 0 },
  infoRow: { minHeight: 65, flexDirection: "row", alignItems: "center" },
  infoContent: { flex: 1, marginLeft: 15 },
  infoTitle: { fontSize: 16 },
  infoValue: { fontSize: 13, marginTop: 3 },
  actionRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 15 },
  actionText: { flex: 1, fontSize: 16 },
  dangerText: { color: "#D9534F" },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  footer: { textAlign: "center", fontSize: 12, marginTop: 25 },
  emptyText: { paddingVertical: 12, fontStyle: "italic", fontSize: 13 },
  itemContainer: { paddingVertical: 10 },
  itemTitle: { fontSize: 16, fontWeight: "600" },
  itemBody: { fontSize: 14, marginTop: 4 },
  attachmentBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  attachmentText: { fontSize: 13, textDecorationLine: "underline" },
  submissionInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  submittedText: { fontSize: 13, color: "#34C759" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: { borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 12 },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 },
});