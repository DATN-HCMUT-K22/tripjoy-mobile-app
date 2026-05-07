import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { TripItemResponse } from '@/services/itineraries';
import { LocationImage } from '@/components/location/LocationImage';

type TripItemCardProps = {
  item: TripItemResponse;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showMenu?: boolean;
  showTransport?: boolean;
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
  showMenu = true,
  showTransport = false,
}: TripItemCardProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const location = item.location;
  const category = location?.category || (location?.categories && location.categories.length > 0 ? location.categories[0] : undefined);
  const icon = getCategoryIcon(category);
  const timeRange = formatTimeRange(item.start_time, item.duration);
  const priceRange = formatPriceRange(
    (location as any)?.min_price,
    (location as any)?.max_price
  );

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
  }, [location, item.note]);

  const handleMenuPress = () => {
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
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`Hoạt động ${displayName}`}
    >
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
      {showTransport && item.transport_duration && (
        <View style={styles.infoRow}>
          <Ionicons name="car-outline" size={16} color="#9CA3AF" />
          <Text style={styles.infoText}>
            {item.transport_duration} phút từ trước đó
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
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2BB673',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  locationImage: {
    width: '100%',
    height: 140,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    lineHeight: 22,
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
    height: 140,
    position: 'relative',
  },
});
