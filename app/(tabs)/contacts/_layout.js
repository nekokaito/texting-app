import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";
export default function ContactsLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerShadowVisible: false,
        headerTitleStyle: { color: theme.colors.onSurface },
      }}
    >
      {" "}
      <Stack.Screen name="index" options={{ title: "Contacts" }} />{" "}
    </Stack>
  );
}
