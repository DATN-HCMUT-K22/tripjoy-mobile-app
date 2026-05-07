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
      {/* Message Button (Full-width redesign) */}
      <TouchableOpacity
        style={styles.messageButton}
        onPress={handleMessagePress}
        disabled={isCreatingConversation}
        activeOpacity={0.8}
      >
        {isCreatingConversation ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
            <Text style={styles.messageButtonText}>Nhắn tin</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    width: '100%',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2BB673',
    paddingVertical: 14,
    borderRadius: 100, // Pill shaped
    gap: 10,
    shadowColor: '#2BB673',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
