# Phase 4: Manual Create/Edit Flow

**Duration:** 3-4 days  
**Priority:** High  
**Status:** Not Started  
**Depends On:** Phase 1

## Overview

Implement manual itinerary creation and editing flows with comprehensive form validation (business doc section 4.2 Manual Creation Flow).

## Prerequisites

- ✅ Phase 1 complete (createItinerarySchema, form validation)
- ✅ `useCreateItinerary()` hook exists
- ✅ `useUpdateItinerary()` hook (needs creation)
- ✅ react-hook-form + @hookform/resolvers installed

## Tasks Breakdown

### 1. Create Itinerary Screen
**Estimated:** 6 hours  
**File:** `app/itinerary/create.tsx`

Manual creation form for itineraries.

**Reference:** Business doc section 4.2 Manual Creation Flow

**Form Fields:**
1. Title (required, 3-100 chars)
2. Description (optional, max 500 chars)
3. Start Date (required, date picker)
4. End Date (required, >= start date)
5. Number of People (required, 1-50)
6. Budget Estimate (optional, VND)
7. Themes (multi-select chips)
8. Cover Image (optional, image picker)
9. Group (optional, if user in groups)

**Layout:**
```
┌──────────────────────────────┐
│ [← Back]  Tạo lịch trình mới  │
├──────────────────────────────┤
│ [Cover Image Picker]          │
│ ───────────────────────────── │
│ Tên lịch trình *              │
│ [Text Input]                  │
│                               │
│ Mô tả                         │
│ [Text Area]                   │
│                               │
│ Ngày bắt đầu *                │
│ [Date Picker] 20/03/2024      │
│                               │
│ Ngày kết thúc *               │
│ [Date Picker] 25/03/2024      │
│                               │
│ Số người *                    │
│ [Number Input] 4              │
│                               │
│ Ngân sách dự kiến             │
│ [Number Input] 10,000,000 VND │
│                               │
│ Chủ đề                        │
│ [Chip: Ẩm thực] [Chip: Khám   │
│  phá] [Chip: Thư giãn]        │
│                               │
│ [Button: Tạo lịch trình]      │
└──────────────────────────────┘
```

**Implementation:**
```typescript
// app/itinerary/create.tsx

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { createItinerarySchema, CreateItineraryInput } from '@/schemas/itinerary';

export default function CreateItineraryScreen() {
  const router = useRouter();
  const { control, handleSubmit, formState: { errors } } = useForm<CreateItineraryInput>({
    resolver: zodResolver(createItinerarySchema),
    defaultValues: {
      people_quantity: 1,
      themes: [],
    },
  });
  
  const createMutation = useCreateItinerary();
  
  const onSubmit = async (data: CreateItineraryInput) => {
    const result = await createMutation.mutateAsync(data);
    showSuccessToast('Tạo lịch trình thành công');
    router.replace(`/itinerary/${result.id}`);
  };
  
  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <ScrollView className="px-4 pt-4">
        {/* Cover Image Picker */}
        <Controller
          control={control}
          name="cover_image_url"
          render={({ field }) => (
            <ImagePicker
              value={field.value}
              onChange={field.onChange}
              placeholder="Thêm ảnh bìa"
            />
          )}
        />
        
        {/* Title */}
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              label="Tên lịch trình *"
              placeholder="Ví dụ: Du lịch Đà Nẵng"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.name?.message}
            />
          )}
        />
        
        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextInput
              label="Mô tả"
              placeholder="Mô tả ngắn về chuyến đi..."
              multiline
              numberOfLines={4}
              value={field.value}
              onChangeText={field.onChange}
              error={errors.description?.message}
            />
          )}
        />
        
        {/* Date Range */}
        <View className="flex-row gap-2">
          <Controller
            control={control}
            name="start_date"
            render={({ field }) => (
              <DatePicker
                label="Ngày bắt đầu *"
                value={field.value}
                onChange={field.onChange}
                error={errors.start_date?.message}
                className="flex-1"
              />
            )}
          />
          <Controller
            control={control}
            name="end_date"
            render={({ field }) => (
              <DatePicker
                label="Ngày kết thúc *"
                value={field.value}
                onChange={field.onChange}
                error={errors.end_date?.message}
                className="flex-1"
              />
            )}
          />
        </View>
        
        {/* People */}
        <Controller
          control={control}
          name="people_quantity"
          render={({ field }) => (
            <NumberInput
              label="Số người *"
              value={field.value}
              onChange={field.onChange}
              min={1}
              max={50}
              error={errors.people_quantity?.message}
            />
          )}
        />
        
        {/* Budget */}
        <Controller
          control={control}
          name="budget_estimate"
          render={({ field }) => (
            <CurrencyInput
              label="Ngân sách dự kiến"
              value={field.value}
              onChange={field.onChange}
              currency="VND"
              error={errors.budget_estimate?.message}
            />
          )}
        />
        
        {/* Themes */}
        <Controller
          control={control}
          name="themes"
          render={({ field }) => (
            <ThemeSelector
              label="Chủ đề"
              selected={field.value || []}
              onChange={field.onChange}
              options={THEME_OPTIONS}
            />
          )}
        />
        
        {/* Submit Button */}
        <Button
          onPress={handleSubmit(onSubmit)}
          loading={createMutation.isPending}
          className="mt-6 mb-10"
        >
          Tạo lịch trình
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

**Acceptance Criteria:**
- [ ] Form validates with zod schema
- [ ] All fields render correctly
- [ ] Date picker shows calendar
- [ ] End date must be >= start date
- [ ] Number inputs enforce min/max
- [ ] Theme selector allows multiple
- [ ] Image picker works (camera + gallery)
- [ ] Submit creates itinerary
- [ ] Navigation to detail after success
- [ ] Error messages display
- [ ] Loading state during submit

---

### 2. Edit Itinerary Screen
**Estimated:** 4 hours  
**File:** `app/itinerary/edit/[id].tsx`

Edit existing itinerary with pre-filled form.

**Reference:** Business doc section 4.2

**Differences from Create:**
- Pre-fill form with existing data
- Update mutation instead of create
- Show "Delete" button
- Confirmation before delete

**Implementation:**
```typescript
// app/itinerary/edit/[id].tsx

export default function EditItineraryScreen() {
  const { itineraryId } = useLocalSearchParams<{ itineraryId: string }>();
  const { data: itinerary, isLoading } = useItineraryDetail(itineraryId);
  
  const { control, handleSubmit, reset } = useForm<CreateItineraryInput>({
    resolver: zodResolver(createItinerarySchema),
  });
  
  // Pre-fill form when data loads
  useEffect(() => {
    if (itinerary) {
      reset({
        name: itinerary.title || '',
        description: itinerary.description || '',
        start_date: itinerary.start_date || '',
        end_date: itinerary.end_date || '',
        people_quantity: itinerary.people_quantity || 1,
        budget_estimate: itinerary.budget_estimate,
        themes: itinerary.themes || [],
      });
    }
  }, [itinerary, reset]);
  
  const updateMutation = useUpdateItinerary();
  const deleteMutation = useDeleteItinerary();
  
  const onSubmit = async (data: CreateItineraryInput) => {
    await updateMutation.mutateAsync({
      itineraryId,
      payload: data,
    });
    showSuccessToast('Cập nhật thành công');
    router.back();
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Xóa lịch trình',
      `Bạn có chắc muốn xóa "${itinerary?.title}"? Hành động này không thể hoàn tác.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(itineraryId);
            showSuccessToast('Đã xóa lịch trình');
            router.replace('/itinerary');
          },
        },
      ]
    );
  };
  
  if (isLoading) return <LoadingSkeleton />;
  
  return (
    <View className="flex-1">
      {/* Same form as create but pre-filled */}
      <ScrollView className="px-4 pt-4">
        {/* ... same fields ... */}
        
        <Button onPress={handleSubmit(onSubmit)} loading={updateMutation.isPending}>
          Cập nhật
        </Button>
        
        <Button
          variant="danger"
          onPress={handleDelete}
          loading={deleteMutation.isPending}
          className="mt-4 mb-10"
        >
          Xóa lịch trình
        </Button>
      </ScrollView>
    </View>
  );
}
```

**Acceptance Criteria:**
- [ ] Form pre-fills with existing data
- [ ] Update mutation succeeds
- [ ] Delete shows confirmation
- [ ] Delete removes itinerary
- [ ] Navigation back after update
- [ ] Loading state during fetch

---

### 3. Form Components Library
**Estimated:** 6 hours  
**Files:**
- `components/forms/TextInput.tsx`
- `components/forms/DatePicker.tsx`
- `components/forms/NumberInput.tsx`
- `components/forms/CurrencyInput.tsx`
- `components/forms/ImagePicker.tsx`
- `components/forms/ThemeSelector.tsx`

Reusable form components with validation display.

**TextInput Component:**
```typescript
// components/forms/TextInput.tsx

type TextInputProps = {
  label: string;
  value?: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
};

export function TextInput({ label, error, required, ...props }: TextInputProps) {
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <Text className="text-red-500">*</Text>}
      </Text>
      <RNTextInput
        className={`bg-gray-50 border rounded-xl px-4 py-3 text-base ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
        {...props}
      />
      {error && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}
```

**DatePicker Component:**
```typescript
// components/forms/DatePicker.tsx

import DateTimePicker from '@react-native-community/datetimepicker';

type DatePickerProps = {
  label: string;
  value?: string; // ISO date string
  onChange: (date: string) => void;
  error?: string;
  minimumDate?: Date;
};

export function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  const [show, setShow] = useState(false);
  const date = value ? new Date(value) : new Date();
  
  const handleChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // iOS shows inline
    if (selectedDate) {
      onChange(selectedDate.toISOString().split('T')[0]);
    }
  };
  
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1.5">{label}</Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className={`bg-gray-50 border rounded-xl px-4 py-3 ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
      >
        <Text className="text-base">
          {value ? format(date, 'dd/MM/yyyy') : 'Chọn ngày'}
        </Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      )}
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
```

**NumberInput Component:**
```typescript
// components/forms/NumberInput.tsx

type NumberInputProps = {
  label: string;
  value?: number;
  onChange: (value: number) => void;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
};

export function NumberInput({ label, value, onChange, min, max, error }: NumberInputProps) {
  const [strValue, setStrValue] = useState(value?.toString() || '');
  
  const handleChange = (text: string) => {
    setStrValue(text);
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(num)) {
      const clamped = Math.max(min || -Infinity, Math.min(max || Infinity, num));
      onChange(clamped);
    }
  };
  
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1.5">{label}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={() => onChange(Math.max(min || 1, (value || 0) - 1))}
          className="bg-gray-200 p-3 rounded-l-xl"
        >
          <Ionicons name="remove" size={20} />
        </TouchableOpacity>
        <RNTextInput
          value={strValue}
          onChangeText={handleChange}
          keyboardType="numeric"
          className={`flex-1 bg-gray-50 border-t border-b px-4 py-3 text-center text-base ${
            error ? 'border-red-500' : 'border-gray-200'
          }`}
        />
        <TouchableOpacity
          onPress={() => onChange(Math.min(max || 999, (value || 0) + 1))}
          className="bg-gray-200 p-3 rounded-r-xl"
        >
          <Ionicons name="add" size={20} />
        </TouchableOpacity>
      </View>
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
```

**ThemeSelector Component:**
```typescript
// components/forms/ThemeSelector.tsx

const THEME_OPTIONS = [
  { id: 'food', label: '🍴 Ẩm thực', icon: 'restaurant' },
  { id: 'adventure', label: '🏔️ Khám phá', icon: 'compass' },
  { id: 'relax', label: '🏖️ Thư giãn', icon: 'sunny' },
  { id: 'culture', label: '🎭 Văn hóa', icon: 'library' },
  { id: 'shopping', label: '🛍️ Mua sắm', icon: 'cart' },
  { id: 'nature', label: '🌳 Thiên nhiên', icon: 'leaf' },
];

type ThemeSelectorProps = {
  label: string;
  selected: string[];
  onChange: (themes: string[]) => void;
  options?: typeof THEME_OPTIONS;
};

export function ThemeSelector({ label, selected, onChange, options = THEME_OPTIONS }: Props) {
  const toggleTheme = (themeId: string) => {
    if (selected.includes(themeId)) {
      onChange(selected.filter(id => id !== themeId));
    } else {
      onChange([...selected, themeId]);
    }
  };
  
  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-gray-700 mb-1.5">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map(theme => {
          const isSelected = selected.includes(theme.id);
          return (
            <TouchableOpacity
              key={theme.id}
              onPress={() => toggleTheme(theme.id)}
              className={`flex-row items-center px-4 py-2 rounded-full border ${
                isSelected
                  ? 'bg-primary border-primary'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Text className={isSelected ? 'text-white' : 'text-gray-700'}>
                {theme.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
```

**Acceptance Criteria:**
- [ ] All form components created
- [ ] Components handle controlled input
- [ ] Error display works
- [ ] DatePicker shows native picker
- [ ] NumberInput has +/- buttons
- [ ] CurrencyInput formats with commas
- [ ] ImagePicker handles camera + gallery
- [ ] ThemeSelector toggles multiple
- [ ] All components accessible

---

### 4. Update/Delete Hooks
**Estimated:** 2 hours  
**File:** `hooks/useItineraries.ts` (add functions)

Add missing mutation hooks.

**Implementation:**
```typescript
// hooks/useItineraries.ts

export function useUpdateItinerary() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (args: {
      itineraryId: string;
      payload: ItineraryRequest;
    }) => {
      const res = await itineraryService.updateItinerary(
        args.itineraryId,
        args.payload
      );
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || 'Không cập nhật được lịch trình');
      }
      return res.data ?? null;
    },
    onSuccess: (data, { itineraryId }) => {
      queryClient.invalidateQueries({
        queryKey: ['itineraries', 'detail', itineraryId],
      });
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      showSuccessToast('Cập nhật thành công');
    },
    onError: (error) => {
      showErrorToast('Không cập nhật được', error);
    },
  });
}

export function useDeleteItinerary() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (itineraryId: string) => {
      const res = await itineraryService.deleteItinerary(itineraryId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || 'Không xóa được lịch trình');
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
    },
    onError: (error) => {
      showErrorToast('Không xóa được', error);
    },
  });
}
```

**Acceptance Criteria:**
- [ ] useUpdateItinerary works
- [ ] useDeleteItinerary works
- [ ] Cache invalidation correct
- [ ] Toast notifications show
- [ ] Optimistic update (optional)

---

## Testing Requirements

### Unit Tests
- [ ] Form validation schemas work
- [ ] Date comparison validation
- [ ] Number constraints enforced
- [ ] Theme toggle logic

### Integration Tests
- [ ] Create form submits correctly
- [ ] Edit form pre-fills
- [ ] Update mutation succeeds
- [ ] Delete mutation succeeds
- [ ] Navigation after success
- [ ] Error messages display

### E2E Tests
- [ ] User creates manual itinerary
- [ ] User edits itinerary
- [ ] User deletes itinerary
- [ ] Form validation prevents invalid submit
- [ ] Date picker changes date
- [ ] Theme selector toggles themes

## Acceptance Criteria (Phase Complete)

- [ ] All 4 tasks completed
- [ ] Create screen functional
- [ ] Edit screen functional
- [ ] All form components reusable
- [ ] Mutations work
- [ ] Validation complete
- [ ] Code review passed
- [ ] Tests passing
- [ ] Merged to main branch

## Resources

- Business doc: Section 4.2, 8.1, 9.2
- react-hook-form: https://react-hook-form.com
- zod: https://zod.dev
- @react-native-community/datetimepicker

## Notes

- Form components should be reusable across app
- Consider creating custom Button component
- Image picker needs expo-image-picker permissions
- Date validation is critical for trips
