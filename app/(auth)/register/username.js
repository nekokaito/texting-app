import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import {
  Button,
  HelperText,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import * as FileSystem from "expo-file-system/legacy";

import * as ImagePicker from "expo-image-picker";

import { API_URL } from "../../../constants/API";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const UsernameScreen = () => {
  const router = useRouter();

  const { phone, fullName, email } = useLocalSearchParams();
  const { colors } = useTheme();

  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);

  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [selectedImageAsset, setSelectedImageAsset] = useState(null);
  const [uploading, setUploading] = useState(false);

  const requestId = useRef(0);

  const normalizedUsername = username.trim().toLowerCase();
  const isValidFormat = USERNAME_REGEX.test(normalizedUsername);

  // Select a profile picture
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];

        setSelectedImageAsset(asset);
        setProfilePicture(asset.uri);
      }
    } catch (error) {
      Alert.alert(
        "Image picker error",
        "Unable to select an image. Please try again.",
      );
    }
  };

  const uploadProfilePicture = async () => {
    if (!selectedImageAsset?.uri) {
      return null;
    }

    const asset = selectedImageAsset;

    const mimeType = asset.mimeType || "image/jpeg";

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(mimeType)) {
      throw new Error("Please select a JPEG, PNG, or WebP image.");
    }

    try {
      // Read the selected image as Base64.
      const base64Image = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64Image) {
        throw new Error("Unable to read the selected image.");
      }

      // Send JSON instead of multipart FormData.
      const response = await fetch(`${API_URL}/api/media/profile-picture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType,
          fileName: asset.fileName || "profile-picture",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.secure_url) {
        console.error("Profile picture upload response:", data);

        throw new Error(data.message || "Failed to upload profile picture.");
      }

      return data.secure_url;
    } catch (error) {
      console.error("Profile picture upload error:", error);
      throw error;
    }
  };
  // Remove the selected profile picture
  const handleRemoveImage = () => {
    setProfilePicture(null);
    setSelectedImageAsset(null);
  };

  // Check username availability
  useEffect(() => {
    setAvailable(null);

    if (!isValidFormat) {
      setChecking(false);
      return;
    }

    const currentRequestId = ++requestId.current;

    const timer = setTimeout(async () => {
      setChecking(true);

      try {
        const response = await fetch(`${API_URL}/api/auth/check-username`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: normalizedUsername,
          }),
        });

        const data = await response.json();

        if (currentRequestId !== requestId.current) {
          return;
        }

        if (!response.ok) {
          setAvailable(null);
          return;
        }

        setAvailable(data.available === true);
      } catch (error) {
        if (currentRequestId === requestId.current) {
          setAvailable(null);
        }
      } finally {
        if (currentRequestId === requestId.current) {
          setChecking(false);
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [normalizedUsername, isValidFormat]);

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    if (!isValidFormat || available !== true || checking || uploading) {
      return;
    }

    setUploading(true);

    try {
      let cloudinarySecureUrl = null;

      // Upload only if the user selected a profile picture.
      if (selectedImageAsset?.uri) {
        cloudinarySecureUrl = await uploadProfilePicture();
      }

      router.push({
        pathname: "/register/password",
        params: {
          phone,
          fullName,
          username: normalizedUsername,
          email,
          profilePicture: cloudinarySecureUrl || "",
        },
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);

      Alert.alert(
        "Upload Failed",
        error.message ||
          "Unable to upload your profile picture. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const getStatus = () => {
    if (!normalizedUsername) {
      return "";
    }

    if (!isValidFormat) {
      return "Username must be 3-20 characters and can only contain letters, numbers, and underscores.";
    }

    if (checking) {
      return "Checking username...";
    }

    if (available === true) {
      return "Username is available";
    }

    if (available === false) {
      return "Username is already taken";
    }

    return "";
  };

  const status = getStatus();

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={26}
            iconColor={colors.onSurface}
            onPress={handleBack}
          />

          <Text
            variant="titleLarge"
            style={[
              styles.headerTitle,
              {
                color: colors.onSurface,
              },
            ]}
          >
            Choose a username
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text
            variant="headlineSmall"
            style={[
              styles.title,
              {
                color: colors.onSurface,
              },
            ]}
          >
            Pick your username
          </Text>

          <Text
            variant="bodyMedium"
            style={[
              styles.description,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            Your username helps people find and recognize you.
          </Text>

          {/* Rounded profile photo picker */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePickImage}
              style={[
                styles.photoContainer,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: colors.outline,
                },
              ]}
            >
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture }}
                  style={styles.profileImage}
                />
              ) : (
                <IconButton
                  icon="account"
                  size={55}
                  iconColor={colors.onSurfaceVariant}
                  style={styles.placeholderIcon}
                />
              )}

              {/* Camera icon overlay */}
              <View
                style={[
                  styles.cameraButton,
                  {
                    backgroundColor: colors.primary,
                    borderColor: colors.background,
                  },
                ]}
              >
                <IconButton
                  icon="camera"
                  size={18}
                  iconColor={colors.onPrimary}
                  style={styles.cameraIcon}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
              <Text
                variant="titleSmall"
                style={[
                  styles.photoLabel,
                  {
                    color: colors.primary,
                  },
                ]}
              >
                {profilePicture ? "Change photo" : "Add profile photo"}
              </Text>
            </TouchableOpacity>

            {profilePicture && (
              <TouchableOpacity onPress={handleRemoveImage} activeOpacity={0.7}>
                <Text
                  variant="bodySmall"
                  style={[
                    styles.removeLabel,
                    {
                      color: colors.error,
                    },
                  ]}
                >
                  Remove photo
                </Text>
              </TouchableOpacity>
            )}

            <Text
              variant="bodySmall"
              style={[
                styles.photoHint,
                {
                  color: colors.onSurfaceVariant,
                },
              ]}
            >
              Optional
            </Text>
          </View>

          {/* Username input */}
          <TextInput
            mode="outlined"
            label="Username"
            placeholder="e.g. john_doe"
            value={username}
            onChangeText={setUsername}
            autoFocus={false}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            maxLength={20}
            returnKeyType="next"
            left={<TextInput.Affix text="@" />}
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            error={available === false}
            right={
              checking ? (
                <TextInput.Icon icon="loading" />
              ) : available === true ? (
                <TextInput.Icon
                  icon="check-circle"
                  iconColor={colors.primary}
                />
              ) : available === false ? (
                <TextInput.Icon icon="close-circle" iconColor={colors.error} />
              ) : null
            }
          />

          {status ? (
            <HelperText
              type={available === false || !isValidFormat ? "error" : "info"}
              visible
            >
              {status}
            </HelperText>
          ) : (
            <HelperText type="info" visible>
              3-20 characters. Letters, numbers, and underscores only.
            </HelperText>
          )}
        </View>

        {/* Bottom button */}
        <View style={styles.bottom}>
          <Button
            mode="contained"
            onPress={handleNext}
            disabled={
              !isValidFormat || available !== true || checking || uploading
            }
            loading={uploading}
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            {uploading ? "Uploading photo..." : "Next"}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 25,
  },

  headerTitle: {
    fontWeight: "600",
  },

  headerSpacer: {
    width: 48,
  },

  content: {
    flex: 1,
  },

  title: {
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 10,
  },

  description: {
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 10,
    marginBottom: 20,
  },

  // Profile photo styles
  photoSection: {
    alignItems: "center",
    marginBottom: 25,
  },

  photoContainer: {
    width: 115,
    height: 115,
    borderRadius: 58,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    position: "relative",
    overflow: "visible",
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 58,
  },

  placeholderIcon: {
    margin: 0,
  },

  cameraButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraIcon: {
    margin: 0,
  },

  photoLabel: {
    fontWeight: "600",
    marginTop: 2,
  },

  removeLabel: {
    marginTop: 6,
  },

  photoHint: {
    marginTop: 4,
  },

  // Username styles
  input: {
    backgroundColor: "transparent",
    fontSize: 16,
  },

  bottom: {
    paddingBottom: 5,
  },

  button: {
    borderRadius: 10,
  },

  buttonContent: {
    height: 50,
  },
});

export default UsernameScreen;
