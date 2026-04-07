import {
  SharedHeader,
  type SharedHeaderProps,
} from "@/components/common/SharedHeader";
import React from "react";

type SocialHeaderProps = SharedHeaderProps;

/**
 * Header dùng chung cho màn Home, Profile, Danh sách nhóm:
 * Menu trái, Logo giữa màn hình, Notification + Message phải.
 */
export const SocialHeader: React.FC<SocialHeaderProps> = (props) => {
  return <SharedHeader {...props} withMenuDrawer={true} />;
};
