import { ImageBackground, Text, View } from "react-native";

export default function ChatHeader({
  chat,
  loading,
  styles,
  isOnline,
  lastSeen,
}) {
  if (loading) {
    return <Text style={styles.headerLoading}>Loading...</Text>;
  }

  const displayName =
    chat?.DISPLAY_NAME ||
    chat?.OTHER_FULL_NAME ||
    chat?.OTHER_USERNAME ||
    chat?.TITLE ||
    "Chat";

  const picture = chat?.OTHER_PROFILE_PICTURE;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerAvatar}>
        {picture ? (
          <ImageBackground
            source={{ uri: picture }}
            style={styles.headerAvatarImage}
            imageStyle={styles.headerAvatarImageStyle}
          />
        ) : (
          <Text style={styles.headerAvatarText}>
            {displayName.charAt(0).toUpperCase()}
          </Text>
        )}
      </View>

      <View style={styles.headerTextContainer}>
        <Text numberOfLines={1} style={styles.headerName}>
          {displayName}
        </Text>

        <Text style={styles.headerStatus}>
          {isOnline ? "Online" : lastSeen ? `Last seen ${lastSeen}` : "Offline"}
        </Text>
      </View>
    </View>
  );
}
