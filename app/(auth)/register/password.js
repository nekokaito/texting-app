import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
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
import { API_URL } from "../../../constants/API";

const RegisterPasswordScreen = () => {
  const router = useRouter();
  const { phone, fullName, username, email, profilePicture } =
    useLocalSearchParams();
  const { colors } = useTheme();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValid = password.length >= 8 && password.length <= 72;

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isValid = passwordValid && passwordsMatch;

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    if (!isValid || loading) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
          purpose: "REGISTRATION",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to send verification code");
      }

      router.push({
        pathname: "/otp",
        params: {
          phone,
          fullName,
          username,
          password,
          email,
          profilePicture,
          purpose: "REGISTRATION",
        },
      });
    } catch (error) {
      console.log("Registration OTP error:", error);

      setLoading(false);

      return;
    }

    setLoading(false);
  };

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
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={26}
            iconColor={colors.onSurface}
            onPress={handleBack}
            disabled={loading}
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
            Create password
          </Text>

          <View style={styles.headerSpacer} />
        </View>

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
            Secure your account
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
            Create a password that you will use to sign in to your account.
          </Text>

          <TextInput
            mode="outlined"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!passwordVisible}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textContentType="newPassword"
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            right={
              <TextInput.Icon
                icon={passwordVisible ? "eye-off" : "eye"}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
          />

          <HelperText
            type={password.length > 0 && !passwordValid ? "error" : "info"}
            visible
          >
            Use 8-72 characters.
          </HelperText>

          <TextInput
            mode="outlined"
            label="Confirm password"
            placeholder="Enter your password again"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!confirmPasswordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textContentType="newPassword"
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            error={confirmPassword.length > 0 && !passwordsMatch}
            right={
              <TextInput.Icon
                icon={confirmPasswordVisible ? "eye-off" : "eye"}
                onPress={() =>
                  setConfirmPasswordVisible(!confirmPasswordVisible)
                }
              />
            }
          />

          <HelperText
            type="error"
            visible={confirmPassword.length > 0 && !passwordsMatch}
          >
            Passwords do not match.
          </HelperText>
        </View>

        <View style={styles.bottom}>
          <Button
            mode="contained"
            onPress={handleNext}
            disabled={!isValid || loading}
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              "Continue"
            )}
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
    marginBottom: 35,
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
    marginBottom: 30,
  },

  input: {
    backgroundColor: "transparent",
    marginBottom: 2,
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

export default RegisterPasswordScreen;
