import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { API_URL } from "../../../constants/API";

const PasswordScreen = () => {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const { colors } = useTheme();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValid = password.length >= 8 && password.length <= 20;

  const handleBack = () => {
    router.back();
  };

  const handleNext = async () => {
    if (!isValid || loading) return;

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phone,
          purpose: "LOGIN",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      if (data.exists === false) {
        setError("No account was found with this phone number");
        return;
      }

      router.push({
        pathname: "/otp",
        params: {
          phone,
          password,
          purpose: "LOGIN",
        },
      });
    } catch (error) {
      console.error("Send Login OTP Error:", error);
      setError("Unable to connect to the server");
    } finally {
      setLoading(false);
    }
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
            Password
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
            Enter your password
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
            Enter your password to continue signing in.
          </Text>

          <TextInput
            mode="outlined"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) {
                setError("");
              }
            }}
            secureTextEntry
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            textContentType="password"
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
            error={!!error}
          />

          {error ? (
            <Text
              variant="bodySmall"
              style={[
                styles.error,
                {
                  color: colors.error,
                },
              ]}
            >
              {error}
            </Text>
          ) : null}
        </View>

        <View style={styles.bottom}>
          <Button
            mode="contained"
            onPress={handleNext}
            disabled={!isValid || loading}
            loading={loading}
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            Continue
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
    fontSize: 16,
  },
  error: {
    marginTop: 8,
    paddingHorizontal: 4,
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

export default PasswordScreen;
