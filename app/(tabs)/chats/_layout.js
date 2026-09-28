import { Ionicons } from "@expo/vector-icons";
import { Link, Stack } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity, View, useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";

import { connectSocket } from "../../../services/socket";

export default function ChatsLayout() {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";
  const theme = isDark ? MD3DarkTheme : MD3LightTheme;
  const { colors } = theme;

  useEffect(() => {
    connectSocket();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          statusBarStyle: isDark ? "light" : "dark",
          statusBarColor: colors.background,
          navigationBarColor: colors.background,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Chats",
            headerLargeTitle: true,
            headerTransparent: false,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.onSurface,
            headerLargeTitleStyle: {
              fontSize: 34,
              fontWeight: "700",
              color: colors.onSurface,
            },
            headerRight: () => (
              <View
                style={{
                  flexDirection: "row",
                  gap: 30,
                }}
              >
                <TouchableOpacity>
                  <Ionicons
                    name="camera-outline"
                    color={colors.primary}
                    size={30}
                  />
                </TouchableOpacity>

                <Link href="/contacts" asChild>
                  <TouchableOpacity>
                    <Ionicons
                      name="add-circle"
                      color={colors.primary}
                      size={30}
                    />
                  </TouchableOpacity>
                </Link>
              </View>
            ),
            headerSearchBarOptions: {
              placeholder: "Search",
              textColor: colors.onSurface,
              hintTextColor: colors.onSurfaceVariant,
              headerIconColor: colors.primary,
              barTintColor: colors.surface,
            },
          }}
        />

        <Stack.Screen
          name="[id]"
          options={{
            title: "",
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.onSurface,
          }}
        />

        <Stack.Screen
          name="info/[id]"
          options={{
            title: "Info",
            headerBackTitleVisible: false,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.onSurface,
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
