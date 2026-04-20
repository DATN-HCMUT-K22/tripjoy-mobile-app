/**
 * Analytics tracking utility for social features
 * Tracks user interactions and events for analytics/monitoring
 *
 * Currently logs to console - can be extended to integrate with:
 * - Firebase Analytics
 * - OneSignal
 * - Custom analytics backend
 */

export type AnalyticsEvent =
  // Post events
  | 'post_created'
  | 'post_viewed'
  | 'post_liked'
  | 'post_unliked'
  | 'post_shared'
  | 'post_bookmarked'
  | 'post_unbookmarked'
  | 'post_commented'
  | 'post_reported'
  | 'post_downloaded'
  | 'post_deleted'
  | 'post_updated'
  // Search & Filter events
  | 'search_performed'
  | 'filter_applied'
  | 'hashtag_clicked'
  | 'itinerary_clicked'
  // Navigation events
  | 'profile_viewed'
  | 'explore_tab_opened'
  | 'saved_posts_opened'
  // Error events
  | 'api_error'
  | 'upload_failed';

export interface AnalyticsMetadata {
  // Post-related
  postId?: string;
  postCreatorId?: string;
  postVisibility?: 'PUBLIC' | 'PRIVATE';
  hasItinerary?: boolean;
  mediaCount?: number;

  // User-related
  userId?: string;
  userName?: string;

  // Search & Filter
  searchQuery?: string;
  hashtag?: string;
  filterType?: string;
  filterValue?: any;

  // Error-related
  errorMessage?: string;
  errorCode?: string | number;
  endpoint?: string;

  // General
  timestamp?: number;
  source?: string; // Which screen/component triggered the event
  [key: string]: any; // Allow additional custom properties
}

/**
 * Track an analytics event
 * @param eventName - The event type to track
 * @param metadata - Additional event data
 */
export function trackEvent(
  eventName: AnalyticsEvent,
  metadata?: AnalyticsMetadata
): void {
  const timestamp = Date.now();
  const eventData = {
    event: eventName,
    timestamp,
    ...metadata,
  };

  // Console logging for development
  console.log(`[ANALYTICS] ${eventName}`, eventData);

  // TODO: Integrate with actual analytics service
  // Example integrations:

  // Firebase Analytics
  // analytics().logEvent(eventName, eventData);

  // OneSignal
  // OneSignal.sendTag(eventName, JSON.stringify(eventData));

  // Custom backend
  // fetch('/api/analytics/track', {
  //   method: 'POST',
  //   body: JSON.stringify(eventData)
  // });
}

/**
 * Track post view (call when post is displayed on screen)
 */
export function trackPostView(postId: string, metadata?: AnalyticsMetadata): void {
  trackEvent('post_viewed', {
    postId,
    ...metadata,
  });
}

/**
 * Track post interaction (like, comment, share, etc.)
 */
export function trackPostInteraction(
  action: 'liked' | 'unliked' | 'commented' | 'shared' | 'bookmarked' | 'unbookmarked',
  postId: string,
  metadata?: AnalyticsMetadata
): void {
  const eventMap = {
    liked: 'post_liked',
    unliked: 'post_unliked',
    commented: 'post_commented',
    shared: 'post_shared',
    bookmarked: 'post_bookmarked',
    unbookmarked: 'post_unbookmarked',
  } as const;

  trackEvent(eventMap[action], {
    postId,
    ...metadata,
  });
}

/**
 * Track search query
 */
export function trackSearch(query: string, metadata?: AnalyticsMetadata): void {
  trackEvent('search_performed', {
    searchQuery: query,
    ...metadata,
  });
}

/**
 * Track filter application
 */
export function trackFilter(
  filterType: string,
  filterValue: any,
  metadata?: AnalyticsMetadata
): void {
  trackEvent('filter_applied', {
    filterType,
    filterValue,
    ...metadata,
  });
}

/**
 * Track hashtag click
 */
export function trackHashtagClick(hashtag: string, metadata?: AnalyticsMetadata): void {
  trackEvent('hashtag_clicked', {
    hashtag,
    ...metadata,
  });
}

/**
 * Track API errors for monitoring
 */
export function trackError(
  errorMessage: string,
  metadata?: AnalyticsMetadata
): void {
  trackEvent('api_error', {
    errorMessage,
    ...metadata,
  });
}

/**
 * Batch event tracking for performance
 * Queues events and sends them in batches
 */
class AnalyticsBatcher {
  private queue: Array<{ event: AnalyticsEvent; metadata?: AnalyticsMetadata }> = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private timer: NodeJS.Timeout | null = null;

  track(event: AnalyticsEvent, metadata?: AnalyticsMetadata): void {
    this.queue.push({ event, metadata });

    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  flush(): void {
    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Send batch (implement based on analytics service)
    console.log('[ANALYTICS] Batch flush:', batch.length, 'events');
    batch.forEach(({ event, metadata }) => trackEvent(event, metadata));
  }
}

export const analyticsBatcher = new AnalyticsBatcher();
