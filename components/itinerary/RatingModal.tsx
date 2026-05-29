import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripItemResponse } from '@/services/itineraries';

interface RatingModalProps {
  visible: boolean;
  tripItem: TripItemResponse;
  currentRating?: number;
  currentReview?: string;
  onSave: (rating: number, review: string) => void;
  onClose: () => void;
  isLoading?: boolean;
}

// Star colors - gradient from light yellow to deep gold
const STAR_COLORS = [
  '#FDE68A', // 1 star (very light yellow)
  '#FCD34D', // 2 stars
  '#FBBF24', // 3 stars
  '#F59E0B', // 4 stars
  '#D97706', // 5 stars (deep gold)
];

export function RatingModal({
  visible,
  tripItem,
  currentRating = 0,
  currentReview = '',
  onSave,
  onClose,
  isLoading = false,
}: RatingModalProps) {
  const [rating, setRating] = useState(currentRating || 0);
  const [review, setReview] = useState(currentReview || '');

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setRating(currentRating || 0);
      setReview(currentReview || '');
    }
  }, [visible, currentRating, currentReview]);

  const handleSave = () => {
    if (rating === 0) {
      // Show alert
      return;
    }

    if (review.length > 500) {
      // Show alert
      return;
    }

    onSave(rating, review.trim());
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => {
          const isSelected = star <= rating;
          const starColor = isSelected ? STAR_COLORS[rating - 1] : '#E5E7EB';

          return (
            <TouchableOpacity
              key={star}
              onPress={() => setRating(star)}
              style={styles.starButton}
              accessibilityLabel={`${star} sao`}
              accessibilityRole="button"
            >
              <Ionicons
                name={isSelected ? 'star' : 'star-outline'}
                size={48}
                color={starColor}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Đánh giá địa điểm</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Location Name */}
            <Text style={styles.locationName}>
              {tripItem.location?.name || 'Địa điểm'}
            </Text>

            {/* Star Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionLabel}>Đánh giá của bạn</Text>
              {renderStars()}
              {rating > 0 && (
                <Text style={styles.ratingText}>
                  {rating}.0 {rating === 1 ? 'sao' : 'sao'}
                </Text>
              )}
            </View>

            {/* Review Text */}
            <View style={styles.reviewSection}>
              <Text style={styles.sectionLabel}>
                Nhận xét (không bắt buộc)
              </Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                placeholderTextColor="#9CA3AF"
                value={review}
                onChangeText={setReview}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {review.length}/500
              </Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, (isLoading || rating === 0) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading || rating === 0}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {currentRating > 0 ? 'Cập nhật đánh giá' : 'Lưu đánh giá'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  locationName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 28,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    minHeight: 140,
    marginTop: 12,
  },
  charCount: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#2BB673',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#2BB673',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
