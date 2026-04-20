/**
 * MemberCard Component
 * Displays member information with role badge
 */

import { View, Text, TouchableOpacity } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { GroupMember } from '@/types/group';
import { normalizeAvatarUri } from '@/utils/image';

interface MemberCardProps {
  member: GroupMember;
  isCurrentUser: boolean;
  onPress: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
  return `${Math.floor(diffDays / 365)} năm trước`;
}

export function MemberCard({ member, isCurrentUser, onPress }: MemberCardProps) {
  const avatarUri = normalizeAvatarUri(member.user.avatarUrl);

  return (
    <TouchableOpacity
      className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isCurrentUser}
    >
      {/* Avatar */}
      {avatarUri ? (
        <ExpoImage
          source={{ uri: avatarUri }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View
          className="items-center justify-center bg-primary/20"
          style={{ width: 48, height: 48, borderRadius: 24 }}
        >
          <Text className="text-primary font-semibold text-lg">
            {getInitials(member.user.fullName)}
          </Text>
        </View>
      )}

      {/* Info */}
      <View className="flex-1 ml-3">
        <View className="flex-row items-center gap-2">
          <Text className="font-semibold text-base text-gray-900">
            {member.user.fullName}
          </Text>
          {isCurrentUser && (
            <View className="bg-gray-100 px-2 py-0.5 rounded">
              <Text className="text-xs text-gray-600">Bạn</Text>
            </View>
          )}
        </View>
        <Text className="text-gray-500 text-sm">@{member.user.username}</Text>
        {member.created_at && (
          <Text className="text-gray-400 text-xs mt-0.5">
            Tham gia {formatRelativeTime(member.created_at)}
          </Text>
        )}
      </View>

      {/* Role Badge */}
      <RoleBadge role={member.role} size="sm" />
    </TouchableOpacity>
  );
}
