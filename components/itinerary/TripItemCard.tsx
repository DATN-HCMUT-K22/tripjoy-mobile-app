import { LocationImage } from '@/components/location/LocationImage';
import type { TripItemResponse, TripItemStatus } from '@/services/itineraries';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState, useCallback } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RatingModal } from './RatingModal';

type TripItemCardProps = {
  item: TripItemResponse;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCheckIn?: (tripItemId: string, status: TripItemStatus) => void;
  onRate?: (tripItemId: string, rating: number, review: string) => void;
  isUpdating?: boolean;
  showMenu?: boolean;
  showTransport?: boolean;
  isLast?: boolean;
  showTimeline?: boolean;
  isCompleted?: boolean;
  hideStatusBadge?: boolean;
};

// Status badge styles
const STATUS_STYLES: Record<TripItemStatus, { bg: string; text: string; label: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', label: 'Chưa đến' },
  CHECKED_IN: { bg: '#D1FAE5', text: '#065F46', label: 'Đã check-in' },
  SKIPPED: { bg: '#E5E7EB', text: '#374151', label: 'Đã bỏ qua' },
};

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  food: 'fast-food',
  attraction: 'compass',
  hotel: 'bed',
  accommodation: 'home',
  activity: 'bicycle',
  shopping: 'cart',
  transport: 'car',
  default: 'location',
};

function getCategoryIcon(category?: string): keyof typeof Ionicons.glyphMap {
  if (!category) return 'location';
  const lower = category.toLowerCase();
  return CATEGORY_ICONS[lower] || 'location';
}

function formatTimeRange(startTime?: string, duration?: number): string {
  if (!startTime) return '—';

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) return '—';

  const startStr = start.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (!duration || duration <= 0) {
    return startStr;
  }

  const endTime = new Date(start.getTime() + duration * 60000);
  const endStr = endTime.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const hours = Math.floor(duration / 60);
  const mins = duration % 60;
  const durationStr =
    hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}m` : ''}` : `${mins}m`;

  return `${startStr} - ${endStr} (${durationStr})`;
}

function formatPriceRange(min?: unknown, max?: unknown): string | null {
  const minNum = typeof min === 'number' && !Number.isNaN(min) ? min : null;
  const maxNum = typeof max === 'number' && !Number.isNaN(max) ? max : null;

  if (!minNum && !maxNum) return null;

  const format = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  if (minNum && maxNum && minNum !== maxNum) {
    return `${format(minNum)} - ${format(maxNum)} ₫`;
  }

  if (minNum) return `${format(minNum)} ₫`;
  if (maxNum) return `${format(maxNum)} ₫`;

  return null;
}

export function TripItemCard({
  item,
  onPress,
  onEdit,
  onDelete,
  onCheckIn,
  onRate,
  isUpdating = false,
  showMenu = true,
  showTransport = false,
  isLast = false,
  showTimeline = false,
  isCompleted = false,
  hideStatusBadge = false,
}: TripItemCardProps) {
  const [ratingModalVisible, setRatingModalVisible] = useState(false);

  const location = item.location;
  const status = item.status || 'PENDING';
  const statusStyle = STATUS_STYLES[status];

  // Memoized handlers for performance
  const handleOpenRating = useCallback(() => {
    setRatingModalVisible(true);
  }, []);

  const handleSaveRating = useCallback((rating: number, review: string) => {
    onRate?.(item.id!, rating, review);
    setRatingModalVisible(false);
  }, [onRate, item.id]);

  const handleMenuPress = useCallback(() => {
    if (!onEdit && !onDelete) return;

    Alert.alert(
      location?.name || 'Hoạt động',
      'Chọn hành động',
      [
        ...(onEdit
          ? [
              {
                text: 'Sửa',
                onPress: onEdit,
              },
            ]
          : []),
        ...(onDelete
          ? [
              {
                text: 'Xóa',
                onPress: () => {
                  Alert.alert(
                    'Xác nhận xóa',
                    `Bạn có chắc muốn xóa "${location?.name || 'hoạt động này'}"?`,
                    [
                      { text: 'Hủy', style: 'cancel' },
                      {
                        text: 'Xóa',
                        style: 'destructive',
                        onPress: onDelete,
                      },
                    ]
                  );
                },
                style: 'destructive' as const,
              },
            ]
          : []),
        { text: 'Đóng', style: 'cancel' as const },
      ]
    );
  }, [onEdit, onDelete, location?.name]);

  // Memoized values for performance
  const category = useMemo(() =>
    location?.category || (location?.categories && location.categories.length > 0 ? location.categories[0] : undefined),
    [location?.category, location?.categories]
  );
  const icon = useMemo(() => getCategoryIcon(category), [category]);
  const timeRange = useMemo(() => formatTimeRange(item.start_time, item.duration), [item.start_time, item.duration]);
  const priceRange = useMemo(() => formatPriceRange(
    (location as any)?.min_price,
    (location as any)?.max_price
  ), [location]);

  // Location display name logic
  const displayName = useMemo(() => {
    if (location?.name) return location.name;
    if (item.note) {
      const cleanNote = item.note.trim();
      const match = cleanNote.match(/^([^.,!?:;]+?)\s+(là|có|mang đến|mang lại|là bãi biển|là địa điểm|là một ngôi đền)/i);
      if (match && match[1].length < 60) return match[1].trim();
      return cleanNote.split(/[.,!?:;]/)[0].trim().substring(0, 50);
    }
    return 'Hoạt động';
  }, [location?.name, item.note]);

  return (
    <View style={styles.outerContainer}>
      {showTimeline && (
        <View style={styles.timelineContainer}>
          <View style={[styles.timelineLine, isLast && { height: 20 }]} />
          <View style={styles.timelineDot} />
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.card,
          showTimeline && styles.cardWithTimeline,
          status === 'CHECKED_IN' && styles.cardCheckedIn,
          isUpdating && styles.cardUpdating,
        ]}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress || isUpdating}
        accessibilityRole="button"
        accessibilityLabel={`Hoạt động ${displayName}`}
        accessibilityHint={status === 'CHECKED_IN' ? 'Đã check-in' : status === 'SKIPPED' ? 'Đã bỏ qua' : 'Chưa check-in'}
      >
        {/* Status Badge - Top Right */}
        {!hideStatusBadge && (
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        )}

        {/* Location Image */}
        <LocationImage
          location={location}
          style={styles.locationImage}
          containerStyle={styles.imageContainer}
          placeholderIcon={icon}
        />

        <View style={styles.contentWrapper}>
          {/* Time and Menu Row */}
          <View style={styles.header}>
            <Text style={styles.timeRange}>{timeRange}</Text>
            {showMenu && (onEdit || onDelete) && (
              <TouchableOpacity
                onPress={handleMenuPress}
                style={styles.menuButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Tùy chọn"
                accessibilityRole="button"
                accessibilityHint="Mở menu để sửa hoặc xóa hoạt động này"
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Location Name */}
          <View style={styles.locationRow}>
            <Ionicons name={icon} size={20} color="#2BB673" />
            <Text style={styles.locationName} numberOfLines={2}>
              {displayName}
            </Text>
          </View>

          {/* Address */}
          {location?.full_address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#9CA3AF" />
              <Text style={styles.infoText} numberOfLines={1}>
                {location.full_address}
              </Text>
            </View>
          )}

          {/* Transport Info */}
          {showTransport && item.duration && (
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={16} color="#9CA3AF" />
              <Text style={styles.infoText}>
                {item.duration} phút từ trước đó
              </Text>
            </View>
          )}

          {/* Price Range */}
          {priceRange && (
            <View style={styles.infoRow}>
              <Ionicons name="wallet-outline" size={16} color="#9CA3AF" />
              <Text style={styles.priceText}>{priceRange}</Text>
            </View>
          )}

          {/* Note */}
          {item.note && (
            <View style={styles.noteContainer}>
              <Ionicons name="document-text-outline" size={16} color="#9CA3AF" />
              <Text style={styles.noteText} numberOfLines={2}>
                {item.note}
              </Text>
            </View>
          )}

          {/* Check-in Button - When Pending */}
          {onCheckIn && status === 'PENDING' && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.checkInButton, isUpdating && styles.buttonDisabled]}
                onPress={() => onCheckIn(item.id!, 'CHECKED_IN')}
                disabled={isUpdating}
                accessibilityLabel="Check-in tại địa điểm này"
                accessibilityRole="button"
                accessibilityHint="Đánh dấu bạn đã đến địa điểm này"
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.checkInButtonText}>Check-in</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.skipButton, isUpdating && styles.buttonDisabled]}
                onPress={() => onCheckIn(item.id!, 'SKIPPED')}
                disabled={isUpdating}
                accessibilityLabel="Bỏ qua địa điểm này"
                accessibilityRole="button"
                accessibilityHint="Đánh dấu bạn không đến địa điểm này"
              >
                <Text style={styles.skipButtonText}>Bỏ qua</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Undo Button - When Checked In or Skipped */}
          {onCheckIn && !isCompleted && (status === 'CHECKED_IN' || status === 'SKIPPED') && (
            <TouchableOpacity
              style={[styles.undoButton, isUpdating && styles.buttonDisabled]}
              onPress={() => onCheckIn(item.id!, 'PENDING')}
              disabled={isUpdating}
              accessibilityLabel="Hoàn tác"
              accessibilityRole="button"
              accessibilityHint="Đưa trạng thái về chưa check-in"
            >
              <Ionicons name="arrow-undo" size={16} color="#6B7280" />
              <Text style={styles.undoButtonText}>Hoàn tác</Text>
            </TouchableOpacity>
          )}

          {/* Rating Display - Show when rated */}
          {status === 'CHECKED_IN' && item.rating && (
            <View style={styles.ratingDisplay}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Ionicons
                    key={star}
                    name={star <= item.rating! ? 'star' : 'star-outline'}
                    size={18}
                    color={star <= item.rating! ? '#F59E0B' : '#E5E7EB'}
                  />
                ))}
              </View>
              <Text style={styles.ratingNumber}>{item.rating}.0</Text>
            </View>
          )}

          {/* Review Text - Show if exists */}
          {item.review && (
            <Text style={styles.reviewText} numberOfLines={2}>
              "{item.review}"
            </Text>
          )}

          {/* Rating Button - Show when checked in but not rated */}
          {onRate && status === 'CHECKED_IN' && !item.rating && (
            <TouchableOpacity
              style={styles.rateButton}
              onPress={handleOpenRating}
              accessibilityLabel="Đánh giá địa điểm"
              accessibilityRole="button"
              accessibilityHint="Mở form để đánh giá và viết nhận xét"
            >
              <Ionicons name="star-outline" size={20} color="#F59E0B" />
              <Text style={styles.rateButtonText}>Đánh giá</Text>
            </TouchableOpacity>
          )}

          {/* Edit Rating Button - Show when already rated */}
          {onRate && status === 'CHECKED_IN' && item.rating && (
            <TouchableOpacity
              style={styles.editRateButton}
              onPress={handleOpenRating}
              accessibilityLabel="Sửa đánh giá"
              accessibilityRole="button"
              accessibilityHint="Thay đổi đánh giá và nhận xét của bạn"
            >
              <Ionicons name="pencil" size={16} color="#6B7280" />
              <Text style={styles.editRateButtonText}>Sửa đánh giá</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Rating Modal */}
        <RatingModal
          visible={ratingModalVisible}
          tripItem={item}
          currentRating={item.rating}
          currentReview={item.review}
          onSave={handleSaveRating}
          onClose={() => setRatingModalVisible(false)}
          isLoading={isUpdating}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2BB673',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
    flex: 1,
  },
  cardUpdating: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  locationImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#2BB673',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentWrapper: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 12,
    paddingHorizontal: 16,
  },
  timeRange: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  menuButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  locationName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    lineHeight: 26,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    gap: 6,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2BB673',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingTop: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  outerContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  timelineContainer: {
    width: 40,
    alignItems: 'center',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 19.5,
    width: 2,
    backgroundColor: '#E5E7EB',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2BB673',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: 20,
    zIndex: 1,
  },
  cardWithTimeline: {
    marginLeft: 0,
  },
  cardCheckedIn: {
    opacity: 0.7,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  checkInButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2BB673',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 44,
    gap: 8,
    shadowColor: '#2BB673',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 44,
    backgroundColor: '#F3F4F6',
  },
  skipButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    marginHorizontal: 16,
    minHeight: 44,
    gap: 6,
  },
  undoButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stars: {
    flexDirection: 'row',
    gap: 4,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  reviewText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    lineHeight: 20,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    marginHorizontal: 16,
    minHeight: 44,
    gap: 8,
  },
  rateButtonText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '600',
  },
  editRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 8,
    marginHorizontal: 16,
    minHeight: 44,
    gap: 6,
  },
  editRateButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
