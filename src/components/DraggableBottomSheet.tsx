import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { AppText } from "./AppText";

const { height } = Dimensions.get("window");
const BOTTOM_SHEET_MAX_HEIGHT = height * 0.72;
const MAX_UPWARD_TRANSLATE_Y = 0;
const MAX_DOWNWARD_TRANSLATE_Y = 0;
const DRAG_THRESHOLD = 50;

type DraggableBottomSheetProps = {
  visible: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
};

export function DraggableBottomSheet({
  visible,
  title,
  children,
  onClose,
}: DraggableBottomSheetProps) {
  const animatedValue = useRef(
    new Animated.Value(MAX_DOWNWARD_TRANSLATE_Y),
  ).current;
  const lastGestureDy = useRef(MAX_DOWNWARD_TRANSLATE_Y);

  function springAnimation(direction: "up" | "down") {
    const nextValue =
      direction === "down" ? BOTTOM_SHEET_MAX_HEIGHT : MAX_UPWARD_TRANSLATE_Y;
    lastGestureDy.current = nextValue;

    Animated.spring(animatedValue, {
      toValue: nextValue,
      useNativeDriver: true,
    }).start(() => {
      if (direction === "down") onClose();
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        animatedValue.setOffset(lastGestureDy.current);
      },
      onPanResponderMove: (_, gesture) => {
        animatedValue.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        animatedValue.flattenOffset();

        if (gesture.dy > DRAG_THRESHOLD) {
          springAnimation("down");
          return;
        }

        springAnimation("up");
      },
    }),
  ).current;

  useEffect(() => {
    if (!visible) return;

    lastGestureDy.current = MAX_DOWNWARD_TRANSLATE_Y;
    animatedValue.setValue(MAX_DOWNWARD_TRANSLATE_Y);
    springAnimation("up");
  }, [animatedValue, visible]);

  const bottomSheetAnimation = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [MAX_UPWARD_TRANSLATE_Y, BOTTOM_SHEET_MAX_HEIGHT],
          outputRange: [MAX_UPWARD_TRANSLATE_Y, BOTTOM_SHEET_MAX_HEIGHT],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => springAnimation("down")}
        />
        <Animated.View style={[styles.bottomSheet, bottomSheetAnimation]}>
          <View style={styles.draggableArea} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>
          <View className="gap-4 px-5 pb-8">
            {title ? <AppText variant="subtitle">{title}</AppText> : null}
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    minHeight: BOTTOM_SHEET_MAX_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#E8DDD6",
    backgroundColor: "#F7F1EC",
  },
  draggableArea: {
    width: 132,
    height: 36,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  dragHandle: {
    width: 72,
    height: 6,
    borderRadius: 10,
    backgroundColor: "#D8CBC3",
  },
});
