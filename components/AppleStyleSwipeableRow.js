import { Component } from "react";
import { Alert, Animated, I18nManager, StyleSheet, View } from "react-native";

import { RectButton, Swipeable } from "react-native-gesture-handler";
import { Icon, Text, withTheme } from "react-native-paper";

class AppleStyleSwipeableRow extends Component {
  swipeableRow = null;

  updateRef = (ref) => {
    this.swipeableRow = ref;
  };

  close = () => {
    this.swipeableRow?.close();
  };

  renderRightAction = (text, color, x, progress) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });

    const iconName = text === "More" ? "dots-horizontal" : "archive";

    const pressHandler = () => {
      this.close();
      Alert.alert(text);
    };

    return (
      <Animated.View
        key={text}
        style={{
          flex: 1,
          transform: [{ translateX: trans }],
        }}
      >
        <RectButton
          style={[styles.rightAction, { backgroundColor: color }]}
          onPress={pressHandler}
        >
          <Icon source={iconName} size={24} color="#FFFFFF" />

          <Text variant="labelLarge" style={styles.actionText}>
            {text}
          </Text>
        </RectButton>
      </Animated.View>
    );
  };

  renderRightActions = (progress) => {
    const { theme } = this.props;

    return (
      <View
        style={{
          width: 192,
          flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
        }}
      >
        {this.renderRightAction(
          "More",
          theme.colors.surfaceVariant,
          192,
          progress,
        )}

        {this.renderRightAction(
          "Archive",
          theme.colors.secondary,
          128,
          progress,
        )}
      </View>
    );
  };

  render() {
    const { children } = this.props;

    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        enableTrackpadTwoFingerGesture
        rightThreshold={40}
        renderRightActions={this.renderRightActions}
        onSwipeableOpen={(direction) => {
          console.log(`Opening swipeable from ${direction}`);
        }}
        onSwipeableClose={(direction) => {
          console.log(`Closing swipeable from ${direction}`);
        }}
      >
        {children}
      </Swipeable>
    );
  }
}

const styles = StyleSheet.create({
  rightAction: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  actionText: {
    color: "#FFFFFF",
    marginTop: 4,
  },
});

export default withTheme(AppleStyleSwipeableRow);
