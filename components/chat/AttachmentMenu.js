import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

export default function AttachmentMenu({
  styles,
  onMediaPress,
  onDocumentPress,
}) {
  return (
    <View style={styles.attachmentMenu}>
      <Pressable style={styles.attachmentOption} onPress={onMediaPress}>
        <View style={styles.mediaIconContainer}>
          <Ionicons name="images-outline" size={23} color="#FFFFFF" />
        </View>
        <Text style={styles.attachmentOptionText}>Media</Text>
      </Pressable>

      <Pressable style={styles.attachmentOption} onPress={onDocumentPress}>
        <View style={styles.documentIconContainer}>
          <Ionicons name="document-outline" size={23} color="#FFFFFF" />
        </View>
        <Text style={styles.attachmentOptionText}>Document</Text>
      </Pressable>
    </View>
  );
}
