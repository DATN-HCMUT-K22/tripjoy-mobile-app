import { useAppSelector } from '@/store/hooks';
import { useDeletePost } from '@/hooks/usePostManagement';
import { Post } from '@/types/social';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { ReportModal } from './ReportModal';
import { ContentType } from '@/types/report';

interface PostActionsMenuProps {
  post: Post;
  visible: boolean;
  onClose: () => void;
}

export const PostActionsMenu: React.FC<PostActionsMenuProps> = ({ post, visible, onClose }) => {
  const currentUserId = useAppSelector(state => state.auth.user?.id);
  const isOwner = post.creator_id === currentUserId;
  const deleteMutation = useDeletePost();
  const router = useRouter();
  const [showReportModal, setShowReportModal] = useState(false);

  const handleEdit = () => {
    onClose();
    router.push({
      pathname: "/create-post",
      params: { postId: post.id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa bài viết',
      'Bạn có chắc chắn muốn xóa bài viết này?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            onClose();
            try {
              await deleteMutation.mutateAsync(post.id);
            } catch (error) {
              console.error('Delete post error:', error);
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    onClose();
    setShowReportModal(true);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menu}>
            {isOwner ? (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleEdit} activeOpacity={0.7}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="create-outline" size={24} color="#374151" />
                  </View>
                  <Text style={styles.menuText}>Chỉnh sửa bài viết</Text>
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={handleDelete} activeOpacity={0.7}>
                  <View style={[styles.menuIconContainer, styles.deleteIconContainer]}>
                    <Ionicons name="trash-outline" size={24} color="#DC2626" />
                  </View>
                  <Text style={[styles.menuText, styles.deleteText]}>Xóa bài viết</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleReport} activeOpacity={0.7}>
                  <View style={[styles.menuIconContainer, styles.reportIconContainer]}>
                    <Ionicons name="flag-outline" size={24} color="#EF4444" />
                  </View>
                  <Text style={[styles.menuText, styles.reportText]}>Báo cáo vi phạm</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.divider} />

            <TouchableOpacity style={styles.menuItem} onPress={onClose} activeOpacity={0.7}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="close-outline" size={24} color="#6B7280" />
              </View>
              <Text style={styles.cancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentId={post.id}
        contentType={ContentType.POST}
        contentTitle={post.content?.substring(0, 50)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    padding: 16,
  },
  menu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deleteIconContainer: {
    backgroundColor: '#FEE2E2',
  },
  reportIconContainer: {
    backgroundColor: '#FEE2E2',
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  deleteText: {
    color: '#DC2626',
  },
  reportText: {
    color: '#EF4444',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 20,
  },
});
