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

const NameScreen = () => {
  const router = useRouter();
  const { phone } = useLocalSearchParams();
  const { colors } = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const trimmedFirstName = firstName.trim();
  const trimmedLastName = lastName.trim();

  const isValid = trimmedFirstName.length >= 2 && trimmedLastName.length >= 1;

  const handleBack = () => {
    router.back();
  };

  const handleNext = () => {
    if (!isValid) return;

    const fullName = `${trimmedFirstName} ${trimmedLastName}`;

    router.push({
      pathname: "/register/email",
      params: {
        phone,
        fullName,
      },
    });
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
            Your name
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
            What should we call you?
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
            Enter your first and last name. This is the name people will see
            when they interact with you.
          </Text>

          <TextInput
            mode="outlined"
            label="First name"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            textContentType="givenName"
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
          />

          <TextInput
            mode="outlined"
            label="Last name"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            textContentType="familyName"
            style={styles.input}
            outlineColor={colors.outline}
            activeOutlineColor={colors.primary}
          />

          <Text
            variant="bodySmall"
            style={[
              styles.helper,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            You can change your name later in settings.
          </Text>
        </View>

        <View style={styles.bottom}>
          <Button
            mode="contained"
            onPress={handleNext}
            disabled={!isValid}
            contentStyle={styles.buttonContent}
            style={styles.button}
          >
            Next
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
    marginBottom: 14,
  },
  helper: {
    marginTop: 2,
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

export default NameScreen;
