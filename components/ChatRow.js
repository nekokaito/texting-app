import AppleStyleSwipeableRow from "./AppleStyleSwipeableRow";

import { format } from "date-fns";
import { Link } from "expo-router";

import { Image, Text, TouchableHighlight, View } from "react-native";

import { useTheme } from "react-native-paper";

export default function ChatRow({ chat }) {
  const { colors } = useTheme();

  // Support the actual backend response and the previous mock structure.
  const chatId = chat.CHAT_ID ?? chat.chat_id;

  const displayName =
    chat.DISPLAY_NAME ??
    chat.OTHER_FULL_NAME ??
    chat.OTHER_USERNAME ??
    chat.display_name ??
    "Unknown";

  const profileImage = chat.OTHER_PROFILE_PICTURE ?? chat.profile_image ?? null;

  const lastMessage =
    chat.LAST_MESSAGE_TEXT ?? chat.last_message?.content ?? "";

  const lastMessageDate =
    chat.LAST_MESSAGE_SENT_AT ??
    chat.last_message?.created_at ??
    chat.CREATED_AT ??
    chat.created_at;

  // Format the date safely.
  let formattedDate = "";

  if (lastMessageDate) {
    const date = new Date(lastMessageDate);

    if (!Number.isNaN(date.getTime())) {
      formattedDate = format(date, "MM.dd.yy");
    }
  }

  // Keep the preview within 40 characters.
  const messagePreview =
    lastMessage.length > 40
      ? `${lastMessage.substring(0, 40)}...`
      : lastMessage;

  // Do not render a row without a valid chat ID.
  if (chatId == null) {
    return null;
  }

  return (
    <AppleStyleSwipeableRow>
      <Link href={`/(tabs)/chats/${chatId}`} asChild>
        <TouchableHighlight
          activeOpacity={0.8}
          underlayColor={colors.surfaceVariant}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingLeft: 20,
              paddingVertical: 10,
              marginTop: 10,
              backgroundColor: colors.background,
            }}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 50,
                }}
              />
            ) : (
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 50,
                  backgroundColor: colors.primaryContainer,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: colors.onPrimaryContainer,
                  }}
                >
                  {displayName.substring(0, 1).toUpperCase()}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: colors.onSurface,
                }}
                numberOfLines={1}
              >
                {displayName}
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  color: colors.onSurfaceVariant,
                }}
                numberOfLines={1}
              >
                {messagePreview || "No messages yet"}
              </Text>
            </View>

            <Text
              style={{
                color: colors.onSurfaceVariant,
                paddingRight: 20,
                alignSelf: "flex-start",
              }}
            >
              {formattedDate}
            </Text>
          </View>
        </TouchableHighlight>
      </Link>
    </AppleStyleSwipeableRow>
  );
}
