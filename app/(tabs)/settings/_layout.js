import { Stack } from "expo-router";
import { useTheme } from "react-native-paper";

export default function SettingsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.onSurface,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Settings",
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: "Search",
            barTintColor: colors.surface,
            tintColor: colors.primary,
            textColor: colors.onSurface,
          },
        }}
      />
    </Stack>
  );
}
