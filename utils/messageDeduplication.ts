/**
 * Message Deduplication Service
 *
 * Prevents duplicate socket events from inflating unread counts.
 * Uses LRU cache to bound memory usage.
 */
class MessageDeduplicationService {
  private seenIds: Set<string>;
  private readonly MAX_SIZE = 5000;
  private insertionOrder: string[] = [];
  private stats = {
    totalChecks: 0,
    duplicatesBlocked: 0,
    cacheEvictions: 0,
  };

  constructor() {
    this.seenIds = new Set();
  }

  /**
   * Check if a message ID has been seen before
   * @param messageId Unique message identifier
   * @returns true if duplicate, false if new
   */
  isDuplicate(messageId: string): boolean {
    this.stats.totalChecks++;

    if (this.seenIds.has(messageId)) {
      this.stats.duplicatesBlocked++;
      return true;
    }

    // Add to cache
    this.seenIds.add(messageId);
    this.insertionOrder.push(messageId);

    // Evict oldest if exceeded capacity (LRU)
    if (this.seenIds.size > this.MAX_SIZE) {
      const oldest = this.insertionOrder.shift();
      if (oldest) {
        this.seenIds.delete(oldest);
        this.stats.cacheEvictions++;
      }
    }

    return false;
  }

  /**
   * Clear all cached message IDs
   * Use when user logs out or significant state change
   */
  clear(): void {
    this.seenIds.clear();
    this.insertionOrder = [];
    this.stats = {
      totalChecks: 0,
      duplicatesBlocked: 0,
      cacheEvictions: 0,
    };
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.seenIds.size;
  }

  /**
   * Get performance statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.seenIds.size,
      blockRate: this.stats.totalChecks > 0
        ? (this.stats.duplicatesBlocked / this.stats.totalChecks * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Log statistics to console (for debugging)
   */
  logStats(): void {
    console.log('[MessageDeduper] Stats:', this.getStats());
  }
}

// Singleton instance
export const messageDeduper = new MessageDeduplicationService();

// For debugging in development
if (__DEV__) {
  // Log stats every 60 seconds
  setInterval(() => {
    if (messageDeduper.size() > 0) {
      messageDeduper.logStats();
    }
  }, 60000);
}
