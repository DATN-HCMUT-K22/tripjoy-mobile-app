/**
 * useGroupPreferences Hook
 * Manages group preferences like pinning with haptic feedback
 */

import { useState, useEffect, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { getPinnedGroups, toggleGroupPin } from '@/utils/storage/groupPreferences';
import Toast from 'react-native-toast-message';

export function useGroupPreferences() {
  const [pinnedGroupIds, setPinnedGroupIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPinnedGroups();
  }, []);

  const loadPinnedGroups = async () => {
    try {
      const pinned = await getPinnedGroups();
      setPinnedGroupIds(pinned);
    } catch (error) {
      console.error('Failed to load pinned groups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePin = useCallback(async (groupId: string, groupName?: string) => {
    try {
      const newState = await toggleGroupPin(groupId);
      await loadPinnedGroups(); // Refresh state

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Toast notification
      Toast.show({
        type: 'success',
        text1: newState ? 'Đã ghim nhóm' : 'Đã bỏ ghim nhóm',
        text2: groupName || undefined,
        visibilityTime: 2000,
      });

      return newState;
    } catch (error) {
      console.error('Failed to toggle pin:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể thay đổi trạng thái ghim',
      });
      return false;
    }
  }, []);

  const isPinned = useCallback(
    (groupId: string) => pinnedGroupIds.includes(groupId),
    [pinnedGroupIds]
  );

  return {
    pinnedGroupIds,
    togglePin,
    isPinned,
    isLoading,
  };
}
