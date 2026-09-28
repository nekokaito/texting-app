import { StyleSheet } from "react-native";

export const createChatStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    headerContainer: {
      flexDirection: "row",
      alignItems: "center",
      maxWidth: 250,
    },

    headerLoading: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
    },

    headerAvatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.colors.surfaceVariant,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
      overflow: "hidden",
    },

    headerAvatarImage: {
      width: 38,
      height: 38,
    },

    headerAvatarImageStyle: {
      borderRadius: 19,
    },

    headerAvatarText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      fontWeight: "600",
    },

    headerTextContainer: {
      flexShrink: 1,
    },

    headerName: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },

    headerStatus: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },

    chatBackground: {
      flex: 1,
    },

    backgroundImage: {
      opacity: theme.dark ? 0.15 : 0.45,
    },

    messageList: {
      paddingHorizontal: 10,
      paddingTop: 12,
      paddingBottom: 90,
      flexGrow: 1,
    },

    messageRow: {
      width: "100%",
      marginVertical: 2,
    },

    myMessageRow: {
      alignItems: "flex-end",
    },

    otherMessageRow: {
      alignItems: "flex-start",
    },

    messageBubble: {
      maxWidth: "82%",
      minWidth: 60,
      paddingHorizontal: 10,
      paddingTop: 6,
      paddingBottom: 5,
      borderRadius: 12,
    },

    myBubble: {
      backgroundColor: theme.colors.primaryContainer,
      borderTopRightRadius: 4,
    },

    otherBubble: {
      backgroundColor: theme.colors.elevation.level1,
      borderTopLeftRadius: 4,
    },

    senderName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
      marginBottom: 2,
    },

    messageContentRow: {
      flexDirection: "row",
      alignItems: "flex-end",
    },

    messageText: {
      fontSize: 16,
      lineHeight: 21,
      flexShrink: 1,
    },

    myMessageText: {
      color: theme.colors.onPrimaryContainer,
    },

    otherMessageText: {
      color: theme.colors.onSurface,
    },

    messageTime: {
      fontSize: 11,
      marginLeft: 8,
      marginBottom: 1,
    },

    myMessageTime: {
      color: theme.colors.onPrimaryContainer,
      opacity: 0.7,
    },

    otherMessageTime: {
      color: theme.colors.onSurfaceVariant,
    },

    composerContainer: {
      position: "absolute",
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
    },

    replyBar: {
      minHeight: 55,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surfaceVariant,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },

    replyIndicator: {
      width: 5,
      height: "100%",
      backgroundColor: theme.colors.primary,
    },

    replyContent: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    replyTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.primary,
    },

    replyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    },

    closeReplyButton: {
      paddingHorizontal: 10,
    },

    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 8,
      paddingVertical: 6,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },

    addButton: {
      width: 40,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },

    inputIcon: {
      width: 40,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },

    textInput: {
      flex: 1,
      maxHeight: 100,
      minHeight: 42,
      backgroundColor: theme.colors.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      paddingHorizontal: 15,
      paddingTop: 10,
      paddingBottom: 9,
      fontSize: 16,
      color: theme.colors.onSurface,
    },

    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 5,
      marginBottom: 2,
    },

    sendButtonDisabled: {
      opacity: 0.65,
    },

    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 25,
      backgroundColor: theme.colors.background,
    },

    errorText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      marginTop: 12,
    },

    statusText: {
      fontSize: 15,
      color: theme.colors.onSurfaceVariant,
      marginTop: 12,
    },

    retryButton: {
      marginTop: 18,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 20,
    },

    retryButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: "600",
    },

    inlineError: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.errorContainer,
    },

    inlineErrorText: {
      color: theme.colors.onErrorContainer,
      textAlign: "center",
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 30,
    },

    emptyText: {
      color: theme.colors.onSurfaceVariant,
      fontSize: 15,
    },

    attachmentMenu: {
      position: "absolute",
      bottom: 85,
      left: 12,
      zIndex: 1000,
      elevation: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 8,
      minWidth: 175,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    attachmentOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: 12,
    },

    attachmentOptionText: {
      fontSize: 15,
      fontWeight: "500",
      color: theme.colors.onSurface,
      marginLeft: 12,
    },

    mediaIconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#8B5CF6",
      alignItems: "center",
      justifyContent: "center",
    },

    documentIconContainer: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: "#3B82F6",
      alignItems: "center",
      justifyContent: "center",
    },

    attachmentPreview: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      marginHorizontal: 8,
      marginBottom: 6,
      borderRadius: 12,
      backgroundColor: theme.colors.surfaceVariant,
    },

    attachmentPreviewImage: {
      width: 55,
      height: 55,
      borderRadius: 8,
    },

    attachmentPreviewInfo: {
      flex: 1,
      marginLeft: 12,
    },

    attachmentPreviewName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.colors.onSurface,
    },

    attachmentPreviewType: {
      fontSize: 12,
      marginTop: 4,
      color: theme.colors.onSurfaceVariant,
    },

    removeAttachmentButton: {
      padding: 5,
    },

    chatAttachment: {
      marginBottom: 6,
      borderRadius: 10,
      overflow: "hidden",
    },

    chatAttachmentImage: {
      width: 220,
      height: 200,
      borderRadius: 10,
    },

    chatAttachmentFile: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 10,
      backgroundColor: theme.colors.surfaceVariant,
      minWidth: 190,
      maxWidth: 250,
    },

    chatAttachmentFileName: {
      flex: 1,
      marginHorizontal: 10,
      fontSize: 14,
      color: theme.colors.onSurface,
    },
  });
