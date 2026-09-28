import { useRouter } from "expo-router";

import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

const welcomeImage = require("../../assets/images/icon.png");

export default function WelcomeScreen() {
  const router = useRouter();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const colors = {
    background: isDark ? "#121212" : "#FFFFFF",
    text: isDark ? "#FFFFFF" : "#000000",
    description: isDark ? "#B0B0B0" : "#667781",
    buttonBackground: isDark ? "#3D3518" : "#F9E7A0",
    buttonText: isDark ? "#F5D76E" : "#A88F00",
    link: isDark ? "#F5D76E" : "#B08A00",
  };

  const openPrivacyPolicy = () => {
    Linking.openURL("https://example.com/privacy");
  };

  const openTerms = () => {
    Linking.openURL("https://example.com/terms");
  };

  const handleContinue = () => {
    router.replace("/phone");
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <Image source={welcomeImage} style={styles.welcome} />

      <Text
        style={[
          styles.headline,
          {
            color: colors.text,
          },
        ]}
      >
        Welcome to Texting App
      </Text>

      <Text
        style={[
          styles.description,
          {
            color: colors.description,
          },
        ]}
      >
        Read our{" "}
        <Text
          style={[
            styles.link,
            {
              color: colors.link,
            },
          ]}
          onPress={openPrivacyPolicy}
        >
          Privacy Policy
        </Text>
        . Tap Agree & Continue to accept our{" "}
        <Text
          style={[
            styles.link,
            {
              color: colors.link,
            },
          ]}
          onPress={openTerms}
        >
          Terms of Service
        </Text>
        .
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.buttonBackground,
          },
        ]}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: colors.buttonText,
            },
          ]}
        >
          Agree & Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  welcome: {
    width: "80%",
    height: 300,
    borderRadius: 60,
    marginBottom: 80,
    resizeMode: "cover",
  },

  headline: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 20,
    textAlign: "center",
  },

  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 80,
    lineHeight: 21,
  },

  link: {
    fontWeight: "500",
  },

  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
  },

  buttonText: {
    fontSize: 22,
    fontWeight: "500",
  },
});
