/**
 * GroupHeader Component
 * Gradient header for group detail with role-based actions
 */

import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { AppBottomSheet } from '@/components/common/AppBottomSheet';
import { AppDialogModal } from '@/components/common/AppDialogModal';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { Group } from '@/types/group';
import { getCurrentUserRole, isGroupLeader, isGroupManager } from '@/utils/roleUtils';
import { useDeleteGroup, useLeaveGroup } from '@/hooks/useGroups';
import { showErrorToast } from '@/utils/toast';
import { normalizeAvatarUri } from '@/utils/image';

interface GroupHeaderProps {
  group: Group;
  currentUserId?: string;
}

interface HeaderAction {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

export function GroupHeader({ group, currentUserId }: GroupHeaderProps) {
  // const router = useRouter();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [imageError, setImageError] = useState(false);

  const currentUserRole = getCurrentUserRole(group, currentUserId);
  const isManager = isGroupManager(group, currentUserId);
  const isLeader = isGroupLeader(group, currentUserId);

  const { mutate: deleteGroup } = useDeleteGroup();
  const { mutate: leaveGroup } = useLeaveGroup();

  const handleDeleteGroup = () => {
    setShowDeleteConfirm(true);
  };

  const headerActions = useMemo((): HeaderAction[] => {
    const actions: HeaderAction[] = [];

    if (isManager) {
      actions.push({
        icon: 'create-outline',
        label: 'Chỉnh sửa thông tin',
        onPress: () => {
          setShowActionSheet(false);
          router.push(`/groups/${group.id}/edit` as any);
        },
      });
    }

    if (!isLeader) {
      actions.push({
        icon: 'exit-outline',
        label: 'Rời nhóm',
        onPress: () => {
          setShowActionSheet(false);
          setShowLeaveConfirm(true);
        },
        danger: true,
      });
    }

    if (isLeader) {
      actions.push({
        icon: 'trash-outline',
        label: 'Xóa nhóm',
        onPress: () => {
          setShowActionSheet(false);
          handleDeleteGroup();
        },
        danger: true,
      });
    }

    return actions;
  }, [isManager, isLeader, group.id, router]);

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActionSheet(true);
  };

  const themeColor = group.theme_color || '#0D9488';
  const memberCount = group.members?.length || 0;
  const initial = group.name?.charAt(0)?.toUpperCase() || '?';
  const avatarUri = normalizeAvatarUri(group.avatar);
  const isFileUri = !!avatarUri?.startsWith('file://');

  return (
    <>
      <LinearGradient
        colors={[themeColor, themeColor + 'DD']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View className="px-4 py-4">
          {/* Top row: Back and Menu */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMenuPress}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Group info row */}
          <View className="flex-row items-center gap-3">
            {/* Avatar */}
            <View
              className="bg-white/20 rounded-full items-center justify-center overflow-hidden border-2 border-white/30"
              style={{ width: 60, height: 60 }}
            >
              {avatarUri && !imageError ? (
                isFileUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <ExpoImage
                    source={{ uri: avatarUri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    onError={() => setImageError(true)}
                  />
                )
              ) : (
                <Text className="text-white font-bold text-2xl">{initial}</Text>
              )}
            </View>

            {/* Name and info */}
            <View className="flex-1">
              <Text className="text-xl font-bold text-white mb-1">{group.name}</Text>
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="people" size={14} color="#fff" />
                  <Text className="text-white/90 text-sm">{memberCount} thành viên</Text>
                </View>
                {currentUserRole && <RoleBadge role={currentUserRole} size="sm" />}
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Action Sheet */}
      <AppBottomSheet
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Tùy chọn nhóm"
        snapPoints={['60%']}
      >
        <View className="pb-4">
          {headerActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              className={`flex-row items-center px-4 py-4 ${
                action.danger ? 'bg-red-50' : ''
              }`}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Ionicons
                name={action.icon as any}
                size={24}
                color={action.danger ? '#EF4444' : '#000'}
              />
              <Text
                className={`ml-3 text-base ${
                  action.danger ? 'text-red-500' : 'text-gray-900'
                }`}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </AppBottomSheet>
      <AppDialogModal
        visible={showDeleteConfirm}
        variant="warning"
        title="Giải tán nhóm"
        message="Bạn có chắc chắn muốn giải tán nhóm này không? Hành động này không thể hoàn tác."
        primaryLabel="Giải tán"
        primaryDestructive
        onPrimaryPress={() => {
          setShowDeleteConfirm(false);
          deleteGroup(group.id);
        }}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setShowDeleteConfirm(false)}
        onRequestClose={() => setShowDeleteConfirm(false)}
      />
      <AppDialogModal
        visible={showLeaveConfirm}
        variant="warning"
        title="Rời nhóm"
        message="Bạn có chắc chắn muốn rời khỏi nhóm này? Bạn sẽ không còn nhận được tin nhắn từ nhóm."
        primaryLabel="Rời nhóm"
        primaryDestructive
        onPrimaryPress={() => {
          setShowLeaveConfirm(false);
          leaveGroup(group.id, {
            onSuccess: () => {
              router.replace('/groups');
            }
          });
        }}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setShowLeaveConfirm(false)}
        onRequestClose={() => setShowLeaveConfirm(false)}
      />
    </>
  );
}
