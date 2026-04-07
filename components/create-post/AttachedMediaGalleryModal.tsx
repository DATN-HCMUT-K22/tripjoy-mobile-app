import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import { Image } from "expo-image";
import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
  FlatList,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Zoomable } from "@likashefqet/react-native-image-zoom";

export type GalleryPickedMedia = {
  uri: string;
  kind: "image" | "video";
};

type Props = {
  visible: boolean;
  items: GalleryPickedMedia[];
  initialIndex: number;
  onClose: () => void;
};

export function AttachedMediaGalleryModal({
  visible,
  items,
  initialIndex,
  onClose,
}: Props) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<GalleryPickedMedia>>(null);
  const [page, setPage] = useState(0);

  const safeInitial = Math.min(
    Math.max(0, initialIndex),
    Math.max(0, items.length - 1)
  );

  const toolbarH = 48;
  const contentH = height - insets.top - toolbarH - insets.bottom;

  useLayoutEffect(() => {
    if (!visible || !items.length) return;
    setPage(safeInitial);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        index: safeInitial,
        animated: false,
      });
    });
  }, [visible, safeInitial, items.length]);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const next = Math.round(x / width);
      setPage(Math.min(Math.max(0, next), items.length - 1));
    },
    [width, items.length]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: width,
      offset: width * index,
      index,
    }),
    [width]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: GalleryPickedMedia; index: number }) => (
      <View style={[styles.page, { width }]}>
        {item.kind === "video" ? (
          <Video
            source={{ uri: item.uri }}
            style={{ width, height: contentH }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay={visible && page === index}
            isLooping={false}
          />
        ) : (
          <Zoomable
            minScale={1}
            maxScale={5}
            doubleTapScale={3}
            isDoubleTapEnabled
            style={[styles.zoomHost, { width, height: contentH }]}
          >
            <Image
              source={{ uri: item.uri }}
              style={{ width, height: contentH }}
              contentFit="contain"
            />
          </Zoomable>
        )}
      </View>
    ),
    [contentH, width, visible, page]
  );

  if (!items.length) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={[styles.toolbar, { height: toolbarH }]}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Đóng"
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.counter}>
              {page + 1} / {items.length}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(item, index) => `${item.uri}-${item.kind}-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={width}
            snapToAlignment="start"
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={onMomentumScrollEnd}
            renderItem={renderItem}
            style={{ flex: 1, width }}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                });
              });
            }}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    backgroundColor: "#000",
  },
  root: {
    flex: 1,
    backgroundColor: "#000",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  counter: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  page: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomHost: {
    overflow: "hidden",
  },
});
