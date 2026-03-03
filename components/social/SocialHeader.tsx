import { SharedHeader } from "@/components/common/SharedHeader";
import React from "react";

interface SocialHeaderProps {
  onNotificationPress?: () => void;
  onMessagePress?: () => void;
  notificationCount?: number;
  messageCount?: number;
  activeIcon?: "notification" | "message" | null;
}

/**
 * Header dùng chung cho màn Home, Profile, Danh sách nhóm:
 * Menu trái, Logo giữa màn hình, Notification + Message phải.
 */
export const SocialHeader: React.FC<SocialHeaderProps> = (props) => {
  return <SharedHeader {...props} withMenuDrawer={true} />;
};
