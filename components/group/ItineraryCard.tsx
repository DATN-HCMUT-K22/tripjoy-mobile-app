import React, { useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Itinerary } from '@/types/group';
import { StatusBadge } from '@/components/itinerary/StatusBadge';

interface ItineraryCardProps {
  itinerary: Itinerary;
  onPress?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  showStatus?: boolean;
  status?: string;
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400';

export const ItineraryCard: React.FC<ItineraryCardProps> = ({
  itinerary,
  onPress,
  onFavorite,
  isFavorite = false,
  showStatus = false,
  status,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatBudget = (amount: number) => {
    if (amount === 0) return 'Chưa ước tính';
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}tr`;
    }
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleFavoritePress = () => {
    onFavorite?.();
  };

  const imageUri = itinerary.image || PLACEHOLDER_IMAGE;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`Lịch trình ${itinerary.name}`}
      >
        {/* Image with Status Badge */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />

          {/* Status Badge Overlay */}
          {showStatus && status && (
            <View style={styles.statusBadge}>
              <StatusBadge status={status} size="sm" />
            </View>
          )}

          {/* Favorite Button Overlay */}
          {onFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoritePress}
              accessibilityRole="button"
              accessibilityLabel={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích'}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#EF4444' : '#FFFFFF'}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Details Section */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2}>
            {itinerary.name}
          </Text>

          {/* Info Rows */}
          <View style={styles.infoContainer}>
            {/* Date Range */}
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}
              </Text>
              <Text style={styles.duration}>({itinerary.duration})</Text>
            </View>

            {/* Members and Budget Row */}
            <View style={styles.metaRow}>
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{itinerary.memberCount} người</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="wallet-outline" size={16} color="#6B7280" />
                <Text style={styles.budgetText}>{formatBudget(itinerary.budget)} ₫</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    lineHeight: 22,
  },
  infoContainer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  duration: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2BB673',
  },
});
