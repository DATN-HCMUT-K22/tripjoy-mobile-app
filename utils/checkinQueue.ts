import AsyncStorage from '@react-native-async-storage/async-storage';
import { TripItemStatus } from '@/services/itineraries';

const QUEUE_KEY = '@tripjoy:checkinQueue';
const MAX_QUEUE_SIZE = 100;

export interface QueuedCheckIn {
  itineraryId: string;
  tripItemId: string;
  status: TripItemStatus;
  timestamp: number;
  retryCount?: number;
  rating?: number;
  review?: string;
}

export const checkinQueue = {
  /**
   * Add a check-in to the offline queue
   */
  async add(item: Omit<QueuedCheckIn, 'timestamp' | 'retryCount'>): Promise<void> {
    try {
      const queue = await this.getAll();

      // Remove existing item for same trip item (replace with new action)
      const filtered = queue.filter(q => q.tripItemId !== item.tripItemId);

      // Add new item
      filtered.push({
        ...item,
        timestamp: Date.now(),
        retryCount: 0,
      });

      // Enforce max queue size
      const trimmed = filtered.slice(-MAX_QUEUE_SIZE);

      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('[CheckinQueue] Failed to add item:', error);
    }
  },

  /**
   * Get all queued check-ins
   */
  async getAll(): Promise<QueuedCheckIn[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('[CheckinQueue] Failed to read queue:', error);
      return [];
    }
  },

  /**
   * Process the queue - attempt to sync all items
   * Returns failed items for retry
   */
  async processQueue(
    updateFn: (
      itineraryId: string,
      tripItemId: string,
      status: TripItemStatus,
      rating?: number,
      review?: string
    ) => Promise<void>
  ): Promise<QueuedCheckIn[]> {
    const queue = await this.getAll();
    if (queue.length === 0) return [];

    const failed: QueuedCheckIn[] = [];

    for (const item of queue) {
      try {
        await updateFn(
          item.itineraryId,
          item.tripItemId,
          item.status,
          item.rating,
          item.review
        );
        console.log(`[CheckinQueue] Synced: ${item.tripItemId} -> ${item.status}`);
      } catch (error) {
        console.error(`[CheckinQueue] Failed to sync: ${item.tripItemId}`, error);

        const retryCount = (item.retryCount || 0) + 1;

        // Max 3 retries
        if (retryCount < 3) {
          failed.push({ ...item, retryCount });
        } else {
          console.warn(`[CheckinQueue] Max retries reached for ${item.tripItemId}, dropping`);
        }
      }
    }

    // Save failed items back to queue
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
    return failed;
  },

  /**
   * Clear the entire queue
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (error) {
      console.error('[CheckinQueue] Failed to clear queue:', error);
    }
  },

  /**
   * Remove a specific item from the queue
   */
  async remove(tripItemId: string): Promise<void> {
    try {
      const queue = await this.getAll();
      const filtered = queue.filter(item => item.tripItemId !== tripItemId);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[CheckinQueue] Failed to remove item:', error);
    }
  },

  /**
   * Get queue count
   */
  async count(): Promise<number> {
    const queue = await this.getAll();
    return queue.length;
  },
};
