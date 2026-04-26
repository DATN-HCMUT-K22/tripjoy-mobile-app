import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { conversationService } from '@/services/conversations';

interface ProfileActionsProps {
  userId: string;
}

export function ProfileActions({ userId }: ProfileActionsProps) {
  const router = useRouter();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);

  const handleFollowPress = () => {
    Alert.alert('Thông báo', 'Tính năng đang phát triển');
  };

  const handleMessagePress = async () => {
    if (isCreatingConversation) return;

    try {
      setIsCreatingConversation(true);

      const response = await conversationService.createDirectConversation({
        targetUserId: userId,
      });

      if (response.data?.id) {
        router.push(`/chat/${response.data.id}` as any);
      } else {
        Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện');
    } finally {
      setIsCreatingConversation(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Follow Button (Disabled) */}
      <TouchableOpacity
        style={[styles.button, styles.followButton]}
        onPress={handleFollowPress}
        disabled={true}
        activeOpacity={0.7}
      >
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Sắp có</Text>
          </View>
        </View>
        <Ionicons name="person-add-outline" size={20} color="#9CA3AF" />
        <Text style={styles.followButtonText}>Theo dõi</Text>
      </TouchableOpacity>

      {/* Message Button (Functional) */}
      <TouchableOpacity
        style={[styles.button, styles.messageButton]}
        onPress={handleMessagePress}
        disabled={isCreatingConversation}
        activeOpacity={0.7}
      >
        {isCreatingConversation ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="chatbubble-outline" size={20} color="#FFFFFF" />
            <Text style={styles.messageButtonText}>Nhắn tin</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  followButton: {
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
    position: 'relative',
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  badge: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  messageButton: {
    backgroundColor: '#2BB673',
  },
  messageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
