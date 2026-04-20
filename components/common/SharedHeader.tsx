import { MenuDrawer } from "@/components/common/MenuDrawer";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface SharedHeaderProps {
  /** Left: mặc định là nút menu mở MenuDrawer. Truyền custom để dùng nút back hoặc khác. */
  leftElement?: React.ReactNode;
  /** Center: mặc định là logo. Truyền custom để dùng title (vd: "Tin nhắn"). */
  centerElement?: React.ReactNode;
  /** Right: mặc định là notification + message icons. Truyền null để ẩn. */
  rightElement?: React.ReactNode | null;
  /** Dùng khi rightElement undefined: số thông báo */
  notificationCount?: number;
  /** Dùng khi rightElement undefined: số tin nhắn */
  messageCount?: number;
  /** Dùng khi rightElement undefined */
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
  activeIcon?: "notification" | "message" | null;
  /** Có hiển thị MenuDrawer khi bấm menu (chỉ khi dùng left mặc định) */
  withMenuDrawer?: boolean;
  /** Màu nền tùy chỉnh (override theme) */
  backgroundColor?: string;
  /** Màu border dưới (optional). Set để ẩn border: borderBottomColor="transparent" hoặc không truyền và dùng mặc định không border) */
  borderBottomColor?: string;
  /** Có hiện border dưới header không (mặc định false = không border) */
  showBorderBottom?: boolean;
}

const LOGO_WIDTH = 120;
const LOGO_HEIGHT = 40;
const HORIZONTAL_PADDING = 16;
const VERTICAL_PADDING = 12;
const MIN_SIDE_WIDTH = 44;

const DefaultLogo = () => (
  <Image
    source={require("@/assets/logo/green.png")}
    style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
    resizeMode="contain"
  />
);

const DefaultRightIcons: React.FC<{
  notificationCount?: number;
  messageCount?: number;
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
  activeIcon?: "notification" | "message" | null;
  iconColor?: string;
  activeColor?: string;
}> = ({
  notificationCount = 0,
  messageCount = 0,
  onNotificationPress,
  onMessagePress,
  activeIcon = null,
  iconColor = "#666",
  activeColor = "#34B27D",
}) => (
  <View style={styles.rightRow}>
    <TouchableOpacity
      onPress={onNotificationPress}
      activeOpacity={0.7}
      style={styles.iconButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons
        name="notifications-outline"
        size={28}
        color={iconColor}
      />
      {notificationCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {notificationCount > 9 ? "9+" : notificationCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
    <TouchableOpacity
      onPress={onMessagePress}
      activeOpacity={0.7}
      style={styles.iconButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons
        name="chatbubble-ellipses-outline"
        size={28}
        color={activeIcon === "message" ? activeColor : iconColor}
      />
      {messageCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {messageCount > 9 ? "9+" : messageCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  </View>
);

export function SharedHeader({
  leftElement,
  centerElement,
  rightElement,
  notificationCount = 0,
  messageCount = 0,
  onNotificationPress,
  onMessagePress,
  activeIcon = null,
  withMenuDrawer = true,
  backgroundColor,
  borderBottomColor,
  showBorderBottom = false,
}: SharedHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [menuVisible, setMenuVisible] = useState(false);

  const bg = backgroundColor ?? (isDark ? "#1A1A1A" : "#FFFFFF");
  const borderColor = borderBottomColor ?? (isDark ? "#2A2A2A" : "#E5E7EB");
  const iconColor: string = isDark ? "#9CA3AF" : "#666";
  const activeColor = "#34B27D";

  const defaultLeft = (
    <TouchableOpacity
      onPress={() => setMenuVisible(true)}
      activeOpacity={0.7}
      style={styles.sideButton}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons name="menu" size={28} color={isDark ? "#F3F4F6" : "#111827"} />
    </TouchableOpacity>
  );

  const left = leftElement ?? (withMenuDrawer ? defaultLeft : null);
  const center = centerElement ?? <DefaultLogo />;
  const right =
    rightElement === undefined ? (
      <DefaultRightIcons
        notificationCount={notificationCount}
        messageCount={messageCount}
        onNotificationPress={onNotificationPress}
        onMessagePress={onMessagePress}
        activeIcon={activeIcon}
        iconColor={iconColor ?? "#666"}
        activeColor={activeColor}
      />
    ) : (
      rightElement
    );

  return (
    <>
      <View
        style={[
          styles.wrapper,
          {
            paddingTop: insets.top,
            paddingBottom: VERTICAL_PADDING,
            backgroundColor: bg,
            borderBottomWidth: showBorderBottom ? 1 : 0,
            ...(showBorderBottom && { borderBottomColor: borderColor }),
          },
        ]}
      >
        {/* Left */}
        <View style={styles.side} pointerEvents="box-none">
          {left}
        </View>

        {/* Center: logo căn giữa màn, cùng hàng với icon (bên dưới safe area) */}
        <View
          style={[
            styles.centerAbsolute,
            {
              top: insets.top,
            },
          ]}
          pointerEvents="box-none"
        >
          {center}
        </View>

        {/* Right */}
        <View style={styles.side} pointerEvents="box-none">
          {right}
        </View>
      </View>

      {withMenuDrawer && (
        <MenuDrawer visible={menuVisible} onClose={() => setMenuVisible(false)} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  side: {
    minWidth: MIN_SIDE_WIDTH,
    flexDirection: "row",
    alignItems: "center",
  },
  sideButton: {
    padding: 4,
  },
  /** Logo căn giữa màn, cùng hàng dọc với menu/icon (chỉ trong vùng nội dung, dưới safe area) */
  centerAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconButton: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "700",
  },
});
