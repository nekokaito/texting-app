import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailScreen() {
  const router = useRouter();
  const { phone, fullName } = useLocalSearchParams();
  const theme = useTheme();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleContinue = () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Email is required");
      return;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setError("Enter a valid email address");
      return;
    }

    setError("");

    router.push({
      pathname: "/register/username",
      params: {
        phone,
        fullName,
        email: cleanEmail,
      },
    });
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          What&apos;s your email?
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Enter your email address to continue.
        </Text>

        <TextInput
          mode="outlined"
          label="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) {
              setError("");
            }
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          error={!!error}
          style={styles.input}
        />

        {error ? (
          <Text
            variant="bodySmall"
            style={[styles.error, { color: theme.colors.error }]}
          >
            {error}
          </Text>
        ) : null}

        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Continue
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 8,
    fontWeight: "600",
  },
  subtitle: {
    marginBottom: 28,
  },
  input: {
    marginBottom: 6,
  },
  error: {
    marginTop: 4,
    marginBottom: 12,
  },
  button: {
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    height: 50,
  },
});
