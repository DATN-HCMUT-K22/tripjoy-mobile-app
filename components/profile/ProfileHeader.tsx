import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { resolveUserAvatarUri } from '@/utils/userAvatar';
import type { UserPublicProfile } from '@/types/user';

interface ProfileHeaderProps {
  user: UserPublicProfile;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  // Format member since date
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
  }) : null;

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <Image
        source={{ uri: resolveUserAvatarUri(user.avatarUrl, user.fullName) }}
        style={styles.avatar}
        contentFit="cover"
        cachePolicy="memory-disk"
        placeholder={{ blurhash: 'LKO2?U%2Tw=w]~RBVZRi};RPxuwH' }}
        transition={200}
      />

      {/* Full Name */}
      <Text style={styles.fullName}>{user.fullName}</Text>

      {/* Username */}
      <Text style={styles.username}>@{user.username}</Text>

      {/* Location (conditional) */}
      {user.location && (
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color="#6B7280" />
          <Text style={styles.locationText}>{user.location}</Text>
        </View>
      )}

      {/* Bio (conditional) */}
      {user.bio && <Text style={styles.bio}>{user.bio}</Text>}

      {/* Member Since (conditional) */}
      {memberSince && memberSince !== 'Invalid Date' && (
        <Text style={styles.memberSince}>Thành viên từ {memberSince}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 10,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  username: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  memberSince: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
