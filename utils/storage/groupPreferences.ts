/**
 * Group Preferences Storage
 * Manages client-side preferences like pinned groups
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PINNED_GROUPS_KEY = '@pinned_groups';

/**
 * Get list of pinned group IDs
 */
export async function getPinnedGroups(): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(PINNED_GROUPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get pinned groups:', error);
    return [];
  }
}

/**
 * Toggle pin state for a group
 * @returns new pin state (true if now pinned, false if unpinned)
 */
export async function toggleGroupPin(groupId: string): Promise<boolean> {
  try {
    const pinnedGroups = await getPinnedGroups();
    const index = pinnedGroups.indexOf(groupId);

    if (index > -1) {
      // Unpin
      pinnedGroups.splice(index, 1);
      await AsyncStorage.setItem(PINNED_GROUPS_KEY, JSON.stringify(pinnedGroups));
      return false;
    } else {
      // Pin
      pinnedGroups.push(groupId);
      await AsyncStorage.setItem(PINNED_GROUPS_KEY, JSON.stringify(pinnedGroups));
      return true;
    }
  } catch (error) {
    console.error('Failed to toggle pin:', error);
    throw error;
  }
}

/**
 * Check if a group is pinned
 */
export async function isPinned(groupId: string): Promise<boolean> {
  const pinnedGroups = await getPinnedGroups();
  return pinnedGroups.includes(groupId);
}

/**
 * Clear all pinned groups
 */
export async function clearPinnedGroups(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PINNED_GROUPS_KEY);
  } catch (error) {
    console.error('Failed to clear pinned groups:', error);
    throw error;
  }
}
