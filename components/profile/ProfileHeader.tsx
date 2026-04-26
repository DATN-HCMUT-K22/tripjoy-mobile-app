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
  const memberSince = new Date(user.createdAt).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
  });

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

      {/* Member Since */}
      <Text style={styles.memberSince}>Thành viên từ {memberSince}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  fullName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  username: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#6B7280',
    marginLeft: 4,
  },
  bio: {
    fontSize: 15,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  memberSince: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
