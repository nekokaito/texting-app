import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const isDark = colorScheme === "dark";

  const theme = isDark ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={theme.colors.background}
        translucent={false}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      />
    </PaperProvider>
  );
}
