/**
 * RolePermissionsSheet Component
 * Displays role permissions information
 */

import { View, Text, ScrollView } from 'react-native';
import { AppBottomSheet } from '@/components/common/AppBottomSheet';
import { GroupMemberRole, getRoleBadgeConfig, rolePermissions } from '@/utils/roleUtils';

interface RolePermissionsSheetProps {
  visible: boolean;
  onClose: () => void;
  currentUserRole?: GroupMemberRole;
}

interface RoleSection {
  role: GroupMemberRole;
  icon: string;
  color: string;
  permissions: string[];
}

const rolePermissionsList: RoleSection[] = [
  {
    role: 'LEADER',
    icon: '👑',
    color: '#F59E0B',
    permissions: [
      'Xóa toàn bộ nhóm',
      'Chuyển quyền quản lý',
      'Tất cả quyền của CO-LEADER',
    ],
  },
  {
    role: 'CO_LEADER',
    icon: '🛡️',
    color: '#3B82F6',
    permissions: [
      'Thêm thành viên mới',
      'Xóa thành viên',
      'Chỉnh sửa thông tin nhóm',
      'Thăng/giáng chức thành viên',
      'Ghim tin nhắn trong chat',
    ],
  },
  {
    role: 'MEMBER',
    icon: '👥',
    color: '#9CA3AF',
    permissions: [
      'Xem thông tin nhóm',
      'Tham gia chat',
      'Gợi ý địa điểm',
      'Rời khỏi nhóm',
    ],
  },
];

function RolePermissionSection({
  role,
  icon,
  color,
  permissions,
  isCurrentRole,
}: RoleSection & { isCurrentRole: boolean }) {
  const config = getRoleBadgeConfig(role);

  return (
    <View
      className={`mb-4 p-4 rounded-xl ${
        isCurrentRole ? 'bg-primary/10 border-2 border-primary' : 'bg-gray-50'
      }`}
    >
      <View className="flex-row items-center mb-3">
        <Text className="text-2xl mr-2">{icon}</Text>
        <Text className="text-lg font-bold text-gray-900">{config.label}</Text>
        {isCurrentRole && (
          <View className="ml-auto bg-primary px-2 py-1 rounded">
            <Text className="text-white text-xs font-semibold">Vai trò của bạn</Text>
          </View>
        )}
      </View>
      <View className="space-y-2">
        {permissions.map((permission, index) => (
          <View key={index} className="flex-row items-start">
            <Text className="text-primary mr-2">•</Text>
            <Text className="flex-1 text-gray-700">{permission}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function RolePermissionsSheet({
  visible,
  onClose,
  currentUserRole,
}: RolePermissionsSheetProps) {
  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="Quyền hạn theo vai trò"
      snapPoints={['50%', '90%']}
    >
      <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
        {rolePermissionsList.map((section) => (
          <RolePermissionSection
            key={section.role}
            {...section}
            isCurrentRole={section.role === currentUserRole}
          />
        ))}

        <View className="mt-4 p-4 bg-blue-50 rounded-xl">
          <Text className="text-blue-800 text-sm text-center">
            💡 Vai trò quyết định những gì bạn có thể làm trong nhóm
          </Text>
        </View>
      </ScrollView>
    </AppBottomSheet>
  );
}
