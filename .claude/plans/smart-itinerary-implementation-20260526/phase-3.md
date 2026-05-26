# Phase 3: Rating & Review System

**Status:** Completed ✅  
**Timeline:** 2 days  
**LOC Estimate:** ~300 lines  
**Complexity:** Medium  
**Dependencies:** Phase 1, Phase 2 complete

This phase adds a rating and review system that allows users to rate locations after checking in.

## Overview

After checking in to a location, users should be able to:
- Rate it from 1 to 5 stars
- Write an optional text review (max 500 characters)
- Edit their rating/review later
- See their rating displayed on the trip item card

Ratings are only available for CHECKED_IN items, ensuring users only rate places they actually visited.

## Type Definitions

### File: `services/itineraries.ts`

**Types already updated in Phase 1, verify:**

```typescript
export type UpdateTripItemStatusRequest = {
  status: TripItemStatus;
  rating?: number;      // 1-5, integer
  review?: string;      // max 500 chars
};

export type TripItemResponse = {
  // ... existing fields
  status?: TripItemStatus;
  rating?: number;              // 1-5 stars
  review?: string;              // Review text
  checked_in_at?: string;       // ISO timestamp
};
```

## Rating Modal Component

### File: `components/itinerary/RatingModal.tsx` (NEW)

**Create new file:**

```typescript
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
  const [rating, setRating] = useState(currentRating);
  const [review, setReview] = useState(currentReview);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setRating(currentRating);
      setReview(currentReview);
    }
  }, [visible, currentRating, currentReview]);

  const handleSave = () => {
    if (rating === 0) {
      alert('Vui lòng chọn số sao');
      return;
    }

    if (review.length > 500) {
      alert('Đánh giá không được vượt quá 500 ký tự');
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
                size={40}
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

          <ScrollView showsVerticalScrollIndicator={false}>
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
                  {rating} {rating === 1 ? 'sao' : 'sao'}
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
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 24,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 120,
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#2BB673',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

## Update Trip Item Card

### File: `components/itinerary/TripItemCard.tsx`

**Add rating display and button (after check-in section, around line 120):**

```typescript
import { RatingModal } from './RatingModal';

export function TripItemCard({ item, onPress, onCheckIn, onRate, isUpdating = false }: TripItemCardProps) {
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  
  const handleOpenRating = () => {
    setRatingModalVisible(true);
  };
  
  const handleSaveRating = (rating: number, review: string) => {
    onRate?.(item.id!, rating, review);
    setRatingModalVisible(false);
  };

  return (
    <TouchableOpacity style={styles.card}>
      {/* ... existing status badge ... */}
      
      {/* ... existing content ... */}
      
      {/* Rating Display - Show when rated */}
      {item.status === 'CHECKED_IN' && item.rating && (
        <View style={styles.ratingDisplay}>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(star => (
              <Ionicons
                key={star}
                name={star <= item.rating! ? 'star' : 'star-outline'}
                size={16}
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
      {item.status === 'CHECKED_IN' && !item.rating && (
        <TouchableOpacity
          style={styles.rateButton}
          onPress={handleOpenRating}
          accessibilityLabel="Đánh giá địa điểm"
          accessibilityRole="button"
        >
          <Ionicons name="star-outline" size={18} color="#F59E0B" />
          <Text style={styles.rateButtonText}>Đánh giá</Text>
        </TouchableOpacity>
      )}
      
      {/* Edit Rating Button - Show when already rated */}
      {item.status === 'CHECKED_IN' && item.rating && (
        <TouchableOpacity
          style={styles.editRateButton}
          onPress={handleOpenRating}
          accessibilityLabel="Sửa đánh giá"
          accessibilityRole="button"
        >
          <Ionicons name="pencil" size={16} color="#6B7280" />
          <Text style={styles.editRateButtonText}>Sửa đánh giá</Text>
        </TouchableOpacity>
      )}
      
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
  );
}

// Add new styles
const newStyles = {
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  reviewText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    minHeight: 44,
    gap: 6,
  },
  rateButtonText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  editRateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
    gap: 4,
  },
  editRateButtonText: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
  },
};
```

## Integration in Detail Screen

### File: `app/itinerary/detail.tsx`

**Add rating handler (around line 120):**

```typescript
const handleRate = async (tripItemId: string, rating: number, review: string) => {
  setUpdatingItemId(tripItemId);

  try {
    await updateStatusMutation.mutateAsync({
      itineraryId: id,
      tripItemId,
      payload: {
        status: 'CHECKED_IN', // Maintain checked-in status
        rating,
        review,
      },
    });
  } catch (error) {
    // Add to offline queue with rating data
    await checkinQueue.add({
      itineraryId: id,
      tripItemId,
      status: 'CHECKED_IN',
      rating,
      review,
    });
    
    showSuccessToast('Đã lưu offline', 'Sẽ đồng bộ khi có mạng');
  } finally {
    setUpdatingItemId(null);
  }
};

// Update TripItemCard rendering
{tripItems.map(item => (
  <TripItemCard
    key={item.id}
    item={item}
    onCheckIn={handleCheckIn}
    onRate={handleRate}
    isUpdating={updatingItemId === item.id}
  />
))}
```

## Update Offline Queue

### File: `utils/checkinQueue.ts`

**Update interface to support rating (around line 8):**

```typescript
export interface QueuedCheckIn {
  itineraryId: string;
  tripItemId: string;
  status: TripItemStatus;
  timestamp: number;
  retryCount?: number;
  rating?: number;      // NEW
  review?: string;      // NEW
}
```

**Update processQueue to include rating (around line 35):**

```typescript
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
      console.log(`Synced check-in: ${item.tripItemId} -> ${item.status}`);
    } catch (error) {
      // ... existing retry logic ...
    }
  }

  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  return failed;
}
```

## Testing Checklist

- [ ] Rating modal opens when "Đánh giá" button clicked
- [ ] Rating modal only accessible when status is CHECKED_IN
- [ ] Star selection works (tap to select 1-5 stars)
- [ ] Star colors gradient from light yellow (#FDE68A) to gold (#D97706)
- [ ] Review text input accepts up to 500 characters
- [ ] Character counter updates correctly (xxx/500)
- [ ] Save button disabled when no rating selected
- [ ] Save button shows loading spinner during API call
- [ ] Rating displays correctly on card after save
- [ ] Edit rating button appears after initial rating
- [ ] Edit rating pre-fills existing rating and review
- [ ] Modal closes after successful save
- [ ] Modal closes when backdrop or X button clicked
- [ ] Rating data persists in offline queue
- [ ] Keyboard avoidance works on iOS
- [ ] Validation prevents empty rating submission
- [ ] Validation prevents >500 character reviews

## Acceptance Criteria

1. ✅ Rating modal component created with star selection
2. ✅ Review text input with character limit (500)
3. ✅ Rating only available for CHECKED_IN items
4. ✅ Stars display with gradient yellow colors
5. ✅ Rating and review save to backend correctly
6. ✅ Edit functionality works for existing ratings
7. ✅ Offline support for rating submissions
8. ✅ UI feedback during save operation
9. ✅ Accessibility labels for star buttons

## UI Flow Diagram

```
User checks in → Status becomes CHECKED_IN
→ "Đánh giá" button appears on card
→ User taps button → RatingModal opens
→ User selects 1-5 stars (required)
→ User writes review (optional, max 500 chars)
→ User taps "Lưu đánh giá"
→ PATCH /items/{id}/status with { status: 'CHECKED_IN', rating, review }
→ Modal closes
→ Stars + review display on card
→ "Sửa đánh giá" button replaces "Đánh giá" button
```

## Backend Coordination Needed

**Confirm with backend team:**

1. **Endpoint:** Same as Phase 1 - PATCH `/itineraries/{itineraryId}/items/{tripItemId}/status`
2. **Request Body:**
   ```json
   {
     "status": "CHECKED_IN",
     "rating": 5,          // Integer 1-5
     "review": "Amazing!"  // String, max 500 chars
   }
   ```
3. **Validation:**
   - Rating must be integer between 1-5 (inclusive)
   - Review max length: 500 characters
   - Both fields optional in API, but rating required in UI
4. **Response:** Updated TripItemResponse with rating and review fields

## Next Steps

After Phase 3 is complete and tested:
→ Move to [Phase 4: Enhanced Expense Management](./phase-4.md)
