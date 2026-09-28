import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MaskInput from "react-native-mask-input";
import { useTheme } from "react-native-paper";
import { API_URL } from "../../constants/API";

const BD_PHONE = [
  "+",
  "8",
  "8",
  "0",
  " ",
  "1",
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  /\d/,
];

const PhoneNumberScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { colors } = useTheme();

  const isValid = phoneNumber.length >= 15;

  const handleBack = () => {
    router.replace("/welcome");
  };

  const handleNext = async () => {
    if (!isValid || loading) return;

    setLoading(true);

    try {
      const cleanPhoneNumber = phoneNumber.replace(/\s/g, "");

      const checkResponse = await fetch(
        `${API_URL}/api/auth/check-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: cleanPhoneNumber,
          }),
        }
      );

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        throw new Error(
          checkData.message || "Unable to check phone number"
        );
      }

      if (checkData.exists === true) {
        router.push({
          pathname: "/login/password",
          params: {
            phone: cleanPhoneNumber,
          },
        });

        return;
      }

      router.push({
        pathname: "/register/name",
        params: {
          phone: cleanPhoneNumber,
        },
      });
    } catch (error) {
      console.log("Phone check error:", error);

      Alert.alert(
        "Unable to continue",
        error.message || "Please try again."
      );
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
          <TouchableOpacity
            onPress={handleBack}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={26}
              color={colors.primary}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.onSurface,
              },
            ]}
          >
            Enter phone number
          </Text>

          <View style={{ width: 26 }} />
        </View>

        <Text
          style={[
            styles.description,
            {
              color: colors.onSurfaceVariant,
            },
          ]}
        >
          Please enter your phone number. We will use it to verify your
          account.
        </Text>

        <View
          style={[
            styles.phoneBox,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.countryRow}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.countryName,
                {
                  color: colors.primary,
                },
              ]}
            >
              Bangladesh
            </Text>

            <View style={styles.countryRight}>
              <Text
                style={[
                  styles.countryCode,
                  {
                    color: colors.onSurfaceVariant,
                  },
                ]}
              >
                +880
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.onSurfaceVariant}
              />
            </View>
          </TouchableOpacity>

          <View
            style={[
              styles.separator,
              {
                backgroundColor: colors.outlineVariant,
              },
            ]}
          />

          <MaskInput
            value={phoneNumber}
            keyboardType="phone-pad"
            autoFocus
            editable={!loading}
            placeholder="+880 1XXXXXXXXX"
            placeholderTextColor={colors.onSurfaceVariant}
            onChangeText={(masked) => {
              setPhoneNumber(masked);
            }}
            mask={BD_PHONE}
            style={[
              styles.input,
              {
                color: colors.onSurface,
              },
            ]}
          />
        </View>

        <Text
          style={[
            styles.info,
            {
              color: colors.onSurfaceVariant,
            },
          ]}
        >
          Make sure you enter a phone number that you can receive SMS
          messages on.
        </Text>

        <View style={styles.bottom}>
          <Text
            style={[
              styles.legal,
              {
                color: colors.onSurfaceVariant,
              },
            ]}
          >
            By continuing, you agree to our{" "}
            <Text
              style={[
                styles.link,
                {
                  color: colors.primary,
                },
              ]}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              style={[
                styles.link,
                {
                  color: colors.primary,
                },
              ]}
            >
              Privacy Policy
            </Text>
            .
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!isValid || loading}
            onPress={handleNext}
            style={[
              styles.button,
              {
                backgroundColor:
                  isValid && !loading
                    ? colors.primary
                    : colors.surfaceVariant,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color={colors.onPrimary}
              />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: isValid
                      ? colors.onPrimary
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                Next
              </Text>
            )}
          </TouchableOpacity>
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
    marginBottom: 35,
    marginTop: 20,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 25,
    paddingHorizontal: 10,
  },

  phoneBox: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
  },

  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },

  countryName: {
    fontSize: 17,
    fontWeight: "500",
  },

  countryRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  countryCode: {
    fontSize: 15,
  },

  separator: {
    height: 1,
    width: "100%",
    opacity: 0.5,
    marginTop: 8,
  },

  input: {
    width: "100%",
    fontSize: 17,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },

  info: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 15,
  },

  bottom: {
    flex: 1,
    justifyContent: "flex-end",
  },

  legal: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  link: {
    fontWeight: "500",
  },

  button: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
  },

  buttonText: {
    fontSize: 20,
    fontWeight: "600",
  },
});

export default PhoneNumberScreen;

