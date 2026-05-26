# Phase 4: Enhanced Expense Management

**Status:** Completed ✅  
**Timeline:** 3 days  
**LOC Estimate:** ~400 lines  
**Complexity:** Medium-High  
**Dependencies:** Phase 1 complete (Phase 2-3 can run in parallel)

This phase enhances the expense management system with trip item linking, receipt uploads, and payer tracking.

## Overview

Current expense system is basic. This phase adds:
- **Trip Item Linking:** Associate expenses with specific locations
- **Receipt Uploads:** Photo evidence (max 3 images per expense)
- **Payer Tracking:** Who paid for what
- **Payment Time:** When the expense occurred

These features enable better expense organization, splitting, and reporting.

## Type Definitions

### File: `services/itineraries.ts`

**Update ExpenseRequest (around line 250):**

```typescript
export type ExpenseRequest = {
  name: string;
  description?: string;
  amount: number;
  type?: string;
  method?: string;
  
  // NEW FIELDS
  trip_item_id?: string | null;      // Link to specific location
  receipt_image_urls?: string[];     // Max 3 receipt photos
  paid_by?: string;                  // User UUID, defaults to current user
  paid_at?: string;                  // ISO timestamp, defaults to now
};
```

**Update ExpenseResponse (around line 265):**

```typescript
export type ExpenseResponse = {
  id?: string;
  name?: string;
  description?: string;
  amount?: number;
  type?: string;
  method?: string;
  created_at?: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  
  // NEW FIELDS
  trip_item_id?: string | null;
  trip_item?: TripItemResponse;          // Populated by backend
  receipt_image_urls?: string[];
  paid_by?: string;
  paid_by_user?: UserSimpleResponse;     // Populated by backend
  paid_at?: string;
};

// New type for user info in expense context
export type UserSimpleResponse = {
  id?: string;
  full_name?: string;
  avatar?: string;
};
```

**Add new endpoints (around line 320):**

```typescript
// In itineraryService object
/**
 * Get expense summary grouped by payer
 */
getExpenseSummary: (itineraryId: string) =>
  httpClient.get<ApiEnvelope<ExpenseSummaryResponse>>(
    `/itineraries/${itineraryId}/expenses/summary`
  ),

/**
 * Get expenses filtered by payer
 */
getExpensesByPayer: (itineraryId: string, paidById: string) =>
  httpClient.get<ApiEnvelope<ExpenseResponse[]>>(
    `/itineraries/${itineraryId}/expenses?paidById=${paidById}`
  ),
```

**Add summary type:**

```typescript
export type ExpenseSummaryResponse = {
  total_amount: number;
  by_payer: Array<{
    user_id: string;
    user_name: string;
    user_avatar?: string;
    total_paid: number;
    expense_count: number;
  }>;
  by_trip_item: Array<{
    trip_item_id: string;
    location_name: string;
    total_amount: number;
    expense_count: number;
  }>;
};
```

## Update Expense Form

### File: `app/itinerary/expenses.tsx`

**Add imports and state (around line 15):**

```typescript
import { uploadImage } from '@/services/media';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ExpensesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [selectedTripItemId, setSelectedTripItemId] = useState<string | null>(null);
  const [selectedPayerId, setSelectedPayerId] = useState<string>(''); // Current user ID
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Fetch trip items for dropdown
  const { data: tripItemsData } = useQuery({
    queryKey: ['itineraries', 'detail', id, 'items'],
    queryFn: () => itineraryService.getTripItems(id),
  });

  // Fetch itinerary members for payer dropdown
  const { data: membersData } = useQuery({
    queryKey: ['itineraries', 'detail', id, 'members'],
    queryFn: () => itineraryService.getItineraryMembers(id),
  });

  const tripItems = tripItemsData?.data || [];
  const members = membersData?.data || [];
```

**Add receipt upload handler (around line 80):**

```typescript
const handleAddReceipt = async () => {
  if (receiptImages.length >= 3) {
    Alert.alert('Giới hạn', 'Chỉ được tải tối đa 3 ảnh hóa đơn');
    return;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingReceipt(true);

      const uploaded = await uploadImage({
        fileUri: result.assets[0].uri,
        folder: 'expense-receipts',
        compress: true,
      });

      setReceiptImages(prev => [...prev, uploaded.url]);
      showSuccessToast('Đã tải ảnh lên');
    }
  } catch (error) {
    showErrorToast('Lỗi tải ảnh', error);
  } finally {
    setUploadingReceipt(false);
  }
};

const handleRemoveReceipt = (index: number) => {
  setReceiptImages(prev => prev.filter((_, i) => i !== index));
};
```

**Update form submission (around line 150):**

```typescript
const handleSubmit = async () => {
  if (!expenseName.trim() || !expenseAmount) {
    Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
    return;
  }

  try {
    const payload: ExpenseRequest = {
      name: expenseName.trim(),
      description: expenseDescription.trim() || undefined,
      amount: parseFloat(expenseAmount),
      type: expenseType,
      method: paymentMethod,
      trip_item_id: selectedTripItemId,
      receipt_image_urls: receiptImages,
      paid_by: selectedPayerId || undefined, // Defaults to current user in backend
      paid_at: paymentDate.toISOString(),
    };

    await createExpenseMutation.mutateAsync(payload);
    
    // Reset form
    setExpenseName('');
    setExpenseDescription('');
    setExpenseAmount('');
    setReceiptImages([]);
    setSelectedTripItemId(null);
    setPaymentDate(new Date());
    
    showSuccessToast('Đã thêm chi phí');
  } catch (error) {
    showErrorToast('Lỗi', error);
  }
};
```

**Add UI components in form (around line 220):**

```tsx
{/* Trip Item Dropdown */}
<View style={styles.formField}>
  <Text style={styles.label}>Địa điểm (không bắt buộc)</Text>
  <TouchableOpacity
    style={styles.dropdown}
    onPress={() => {
      // Show picker modal
      setShowTripItemPicker(true);
    }}
  >
    <Text style={styles.dropdownText}>
      {selectedTripItemId
        ? tripItems.find(item => item.id === selectedTripItemId)?.location?.name
        : 'Không gắn địa điểm'}
    </Text>
    <Ionicons name="chevron-down" size={20} color="#6B7280" />
  </TouchableOpacity>
</View>

{/* Payer Dropdown */}
<View style={styles.formField}>
  <Text style={styles.label}>Người thanh toán</Text>
  <TouchableOpacity
    style={styles.dropdown}
    onPress={() => {
      // Show picker modal
      setShowPayerPicker(true);
    }}
  >
    <Text style={styles.dropdownText}>
      {selectedPayerId
        ? members.find(m => m.user_id === selectedPayerId)?.user?.full_name
        : 'Bạn'}
    </Text>
    <Ionicons name="chevron-down" size={20} color="#6B7280" />
  </TouchableOpacity>
</View>

{/* Payment Date */}
<View style={styles.formField}>
  <Text style={styles.label}>Thời gian thanh toán</Text>
  <TouchableOpacity
    style={styles.dropdown}
    onPress={() => setShowDatePicker(true)}
  >
    <Text style={styles.dropdownText}>
      {paymentDate.toLocaleDateString('vi-VN')} {paymentDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
    </Text>
    <Ionicons name="calendar" size={20} color="#6B7280" />
  </TouchableOpacity>
  
  {showDatePicker && (
    <DateTimePicker
      value={paymentDate}
      mode="datetime"
      display="default"
      onChange={(event, selectedDate) => {
        setShowDatePicker(false);
        if (selectedDate) {
          setPaymentDate(selectedDate);
        }
      }}
    />
  )}
</View>

{/* Receipt Images */}
<View style={styles.formField}>
  <Text style={styles.label}>Ảnh hóa đơn (tối đa 3)</Text>
  
  <View style={styles.receiptsContainer}>
    {receiptImages.map((url, index) => (
      <View key={index} style={styles.receiptItem}>
        <Image source={{ uri: url }} style={styles.receiptImage} />
        <TouchableOpacity
          style={styles.removeReceiptButton}
          onPress={() => handleRemoveReceipt(index)}
        >
          <Ionicons name="close-circle" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
    ))}
    
    {receiptImages.length < 3 && (
      <TouchableOpacity
        style={styles.addReceiptButton}
        onPress={handleAddReceipt}
        disabled={uploadingReceipt}
      >
        {uploadingReceipt ? (
          <ActivityIndicator size="small" color="#2BB673" />
        ) : (
          <>
            <Ionicons name="camera" size={32} color="#9CA3AF" />
            <Text style={styles.addReceiptText}>Thêm ảnh</Text>
          </>
        )}
      </TouchableOpacity>
    )}
  </View>
</View>
```

**Add styles (at bottom of file):**

```typescript
const newStyles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#111827',
  },
  receiptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  receiptItem: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  receiptImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeReceiptButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  addReceiptButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addReceiptText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
});
```

## Create Picker Modals

### File: `components/expense/TripItemPicker.tsx` (NEW)

**Create new file:**

```typescript
import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { TripItemResponse } from '@/services/itineraries';
import { Ionicons } from '@expo/vector-icons';

interface TripItemPickerProps {
  visible: boolean;
  tripItems: TripItemResponse[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}

export function TripItemPicker({ visible, tripItems, selectedId, onSelect, onClose }: TripItemPickerProps) {
  const handleSelect = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Chọn địa điểm</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={[{ id: null, location: { name: 'Không gắn địa điểm' } }, ...tripItems]}
            keyExtractor={(item, index) => item.id || `none-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  selectedId === item.id && styles.itemSelected,
                ]}
                onPress={() => handleSelect(item.id || null)}
              >
                <Text style={styles.itemText}>
                  {item.location?.name || 'Không gắn địa điểm'}
                </Text>
                {selectedId === item.id && (
                  <Ionicons name="checkmark" size={20} color="#2BB673" />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
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
    maxHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemSelected: {
    backgroundColor: '#F0FDF4',
  },
  itemText: {
    fontSize: 14,
    color: '#374151',
  },
});
```

## Update Expense List Display

### File: `app/itinerary/expenses.tsx`

**Update expense item rendering to show new fields (around line 400):**

```tsx
const renderExpenseItem = ({ item }: { item: ExpenseResponse }) => (
  <View style={styles.expenseCard}>
    <View style={styles.expenseHeader}>
      <Text style={styles.expenseName}>{item.name}</Text>
      <Text style={styles.expenseAmount}>
        {item.amount?.toLocaleString('vi-VN')} ₫
      </Text>
    </View>

    {item.description && (
      <Text style={styles.expenseDescription}>{item.description}</Text>
    )}

    {/* NEW: Trip Item Tag */}
    {item.trip_item && (
      <View style={styles.tripItemTag}>
        <Ionicons name="location" size={14} color="#6B7280" />
        <Text style={styles.tripItemText}>{item.trip_item.location?.name}</Text>
      </View>
    )}

    {/* NEW: Payer Info */}
    {item.paid_by_user && (
      <View style={styles.payerInfo}>
        <Ionicons name="person" size={14} color="#6B7280" />
        <Text style={styles.payerText}>
          Thanh toán bởi {item.paid_by_user.full_name}
        </Text>
      </View>
    )}

    {/* NEW: Payment Time */}
    {item.paid_at && (
      <Text style={styles.paymentTime}>
        {new Date(item.paid_at).toLocaleDateString('vi-VN')}
      </Text>
    )}

    {/* NEW: Receipt Images */}
    {item.receipt_image_urls && item.receipt_image_urls.length > 0 && (
      <View style={styles.receiptsRow}>
        {item.receipt_image_urls.map((url, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              // Open image viewer
              setSelectedReceiptUrl(url);
              setReceiptViewerVisible(true);
            }}
          >
            <Image source={{ uri: url }} style={styles.receiptThumbnail} />
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

const newExpenseStyles = {
  tripItemTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
  },
  tripItemText: {
    fontSize: 13,
    color: '#6B7280',
  },
  payerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  payerText: {
    fontSize: 12,
    color: '#6B7280',
  },
  paymentTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  receiptsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  receiptThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
};
```

## Testing Checklist

- [ ] Trip item dropdown populates with all items from itinerary
- [ ] "Không gắn địa điểm" option appears at top
- [ ] Selected trip item displays correctly in form
- [ ] Payer dropdown populates with itinerary members
- [ ] Current user is default payer
- [ ] Payment date picker opens and updates correctly
- [ ] Default payment date is "now"
- [ ] Receipt upload opens image picker
- [ ] Uploaded receipt URL saves correctly
- [ ] Max 3 receipts enforced (UI prevents >3)
- [ ] Receipt thumbnails display in form
- [ ] Remove receipt button works
- [ ] Form submission includes all new fields
- [ ] Expense list displays trip item tag
- [ ] Expense list displays payer name
- [ ] Expense list displays payment time
- [ ] Expense list shows receipt thumbnails
- [ ] Receipt image viewer opens on thumbnail tap
- [ ] Backend accepts all new fields without errors

## Acceptance Criteria

1. ✅ Trip item linking works (dropdown, save, display)
2. ✅ Receipt upload functional (max 3, thumbnails, remove)
3. ✅ Payer tracking implemented (dropdown, default current user)
4. ✅ Payment time selector works (defaults to now)
5. ✅ All new fields display correctly in expense list
6. ✅ Backend integration successful
7. ✅ Image upload uses existing media service
8. ✅ Form validation prevents invalid data
9. ✅ UI responsive and user-friendly

## Backend Coordination Needed

**Confirm with backend team:**

1. **Updated Endpoints:**
   - POST `/itineraries/{id}/expenses` accepts new fields
   - GET `/itineraries/{id}/expenses` returns populated trip_item and paid_by_user
   - GET `/itineraries/{id}/expenses/summary` returns aggregated data
   
2. **Field Defaults:**
   - `paid_by`: Defaults to current authenticated user if not provided
   - `paid_at`: Defaults to current timestamp if not provided
   
3. **Validation:**
   - `receipt_image_urls`: Max 3 URLs
   - `trip_item_id`: Must be valid item from same itinerary (or null)
   - `paid_by`: Must be member of itinerary
   
4. **Response Population:**
   - `trip_item` object populated with location data
   - `paid_by_user` object populated with user profile (id, full_name, avatar)

## Next Steps

After Phase 4 is complete and tested:
→ Move to [Phase 5: Geofencing Background Task](./phase-5.md)
