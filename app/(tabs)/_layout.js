import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useTheme } from "react-native-paper";

export default function TabsLayout() {
  const { colors } = useTheme();
  const pathname = usePathname();

  const hideTabBar = pathname !== "/chats" && pathname.startsWith("/chats/");

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },

          headerShadowVisible: false,

          headerTintColor: colors.onSurface,

          tabBarStyle: hideTabBar
            ? { display: "none" }
            : {
                backgroundColor: colors.background,
              },

          tabBarActiveTintColor: colors.primary,

          tabBarInactiveTintColor: colors.onSurfaceVariant,

          tabBarInactiveBackgroundColor: colors.background,

          tabBarActiveBackgroundColor: colors.background,
        }}
      >
        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",

            tabBarIcon: ({ size, color }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),

            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="contacts"
          options={{
            title: "Contacts",

            tabBarIcon: ({ size, color }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),

            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",

            tabBarIcon: ({ size, color }) => (
              <Ionicons name="cog" size={size} color={color} />
            ),

            headerShown: false,
          }}
        />
      </Tabs>
    </GestureHandlerRootView>
  );
}
