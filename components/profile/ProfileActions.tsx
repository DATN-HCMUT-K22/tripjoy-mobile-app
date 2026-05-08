import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { conversationService } from '@/services/conversations';
import { ReportModal } from '@/components/social/ReportModal';
import { ContentType } from '@/types/report';
import { useAppSelector } from '@/store/hooks';

interface ProfileActionsProps {
  userId: string;
}

export function ProfileActions({ userId }: ProfileActionsProps) {
  const router = useRouter();
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Prevent reporting own profile
  const canReport = userId !== currentUserId;

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
      <View style={styles.actionsRow}>
        {/* Message Button */}
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

        {/* Report Button (only if not own profile) */}
        {canReport && (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="flag-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentId={userId}
        contentType={ContentType.USER}
        contentTitle={`User ID: ${userId}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    width: '100%',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2BB673',
    paddingVertical: 14,
    borderRadius: 100,
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
  reportButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
});
