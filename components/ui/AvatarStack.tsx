/**
 * AvatarStack Component
 * Displays overlapping avatars with "+N" indicator for remaining users
 */

import { View, Text } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

interface User {
  id: string;
  avatarUrl?: string;
  fullName: string;
}

interface AvatarStackProps {
  users: User[];
  max?: number;
  size?: number;
  overlap?: number;
}

const DEFAULT_AVATAR_BG = [
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#10B981', // Green
  '#8B5CF6', // Purple
  '#EF4444', // Red
];

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(userId: string): string {
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_AVATAR_BG[index % DEFAULT_AVATAR_BG.length];
}

export function AvatarStack({
  users,
  max = 5,
  size = 32,
  overlap = -8
}: AvatarStackProps) {
  const displayUsers = users.slice(0, max);
  const remainingCount = users.length - max;

  return (
    <View className="flex-row items-center">
      {displayUsers.map((user, index) => (
        <View
          key={user.id}
          style={{
            marginLeft: index === 0 ? 0 : overlap,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: '#fff',
            overflow: 'hidden',
            zIndex: displayUsers.length - index,
          }}
        >
          {user.avatarUrl ? (
            <ExpoImage
              source={{ uri: user.avatarUrl }}
              style={{ width: size, height: size }}
              contentFit="cover"
            />
          ) : (
            <View
              className="items-center justify-center"
              style={{
                width: size,
                height: size,
                backgroundColor: getAvatarColor(user.id),
              }}
            >
              <Text
                className="text-white font-semibold"
                style={{ fontSize: size * 0.4 }}
              >
                {getInitials(user.fullName)}
              </Text>
            </View>
          )}
        </View>
      ))}

      {remainingCount > 0 && (
        <View
          style={{
            marginLeft: overlap,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: '#fff',
            backgroundColor: '#9CA3AF',
          }}
          className="items-center justify-center"
        >
          <Text
            className="text-white font-semibold"
            style={{ fontSize: size * 0.35 }}
          >
            +{remainingCount}
          </Text>
        </View>
      )}
    </View>
  );
}
