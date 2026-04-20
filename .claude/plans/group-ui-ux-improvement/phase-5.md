# Phase 5: Multi-Step Group Creation Wizard

**Duration**: Week 6
**Status**: Completed
**Completion Date**: 2026-04-20
**Depends On**: Phase 1

## Goal

Transform group creation from single modal to engaging multi-step wizard with progress indicator and preview.

## Tasks

### 5.1 Create Wizard Container

**File**: `app/groups/create-wizard.tsx` (NEW)

```typescript
type WizardStep = 'basic' | 'customize' | 'members' | 'review';

interface WizardState {
  step: WizardStep;
  data: {
    name: string;
    description: string;
    avatar?: string;
    themeColor: string;
    isPro: boolean;
    members: Array<{ user: UserSimpleResponse; role: GroupMemberRole }>;
  };
}

export default function CreateGroupWizard() {
  const [wizardState, setWizardState] = useState<WizardState>({
    step: 'basic',
    data: {
      name: '',
      description: '',
      themeColor: '#34B27D',
      isPro: false,
      members: []
    }
  });
  
  const progress = {
    basic: 0.25,
    customize: 0.5,
    members: 0.75,
    review: 1.0
  }[wizardState.step];
  
  const updateAndNext = (nextStep: WizardStep, updates: Partial<WizardState['data']>) => {
    setWizardState(prev => ({
      step: nextStep,
      data: { ...prev.data, ...updates }
    }));
  };
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <WizardHeader
        step={wizardState.step}
        progress={progress}
        onBack={handleBack}
        onClose={handleClose}
      />
      
      {wizardState.step === 'basic' && (
        <BasicInfoStep
          data={wizardState.data}
          onNext={(data) => updateAndNext('customize', data)}
        />
      )}
      {wizardState.step === 'customize' && (
        <CustomizeStep
          data={wizardState.data}
          onNext={(data) => updateAndNext('members', data)}
          onBack={() => setWizardState(prev => ({ ...prev, step: 'basic' }))}
        />
      )}
      {wizardState.step === 'members' && (
        <AddMembersStep
          data={wizardState.data}
          onNext={(data) => updateAndNext('review', data)}
          onBack={() => setWizardState(prev => ({ ...prev, step: 'customize' }))}
          onSkip={() => setWizardState(prev => ({ ...prev, step: 'review' }))}
        />
      )}
      {wizardState.step === 'review' && (
        <ReviewStep
          data={wizardState.data}
          onBack={() => setWizardState(prev => ({ ...prev, step: 'members' }))}
          onCreate={handleCreate}
        />
      )}
    </SafeAreaView>
  );
}
```

**Acceptance Criteria**:
- [ ] State persists across steps
- [ ] Progress indicator updates
- [ ] Back navigation works
- [ ] Close confirmation (if data entered)

---

### 5.2 Create WizardHeader Component

**File**: `components/group/wizard/WizardHeader.tsx` (NEW)

```typescript
export function WizardHeader({ step, progress, onBack, onClose }: Props) {
  const stepLabels = {
    basic: 'Basic Info',
    customize: 'Customize',
    members: 'Add Members',
    review: 'Review'
  };
  
  return (
    <View className="border-b border-gray-200">
      <View className="flex-row items-center justify-between px-4 py-3">
        {step !== 'basic' ? (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        
        <Text className="text-lg font-bold">{stepLabels[step]}</Text>
        
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Progress bar */}
      <View className="h-1 bg-gray-200">
        <Animated.View 
          className="h-full bg-primary"
          style={{ width: `${progress * 100}%` }}
        />
      </View>
    </View>
  );
}
```

**Acceptance Criteria**:
- [ ] Progress bar animates smoothly
- [ ] Back button shows on steps 2-4
- [ ] Close button works
- [ ] Step label updates

---

### 5.3 Create BasicInfoStep Component

**File**: `components/group/wizard/BasicInfoStep.tsx` (NEW)

```typescript
export function BasicInfoStep({ data, onNext }: StepProps) {
  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { name: data.name, description: data.description }
  });
  
  const name = watch('name');
  const description = watch('description');
  
  return (
    <ScrollView className="flex-1 px-4 py-6">
      <Text className="text-2xl font-bold mb-2">Create Your Group</Text>
      <Text className="text-gray-600 mb-6">Start with the basics</Text>
      
      {/* Avatar picker */}
      <View className="items-center mb-6">
        <TouchableOpacity
          onPress={pickImage}
          className="bg-gray-100 rounded-full items-center justify-center"
          style={{ width: 100, height: 100 }}
        >
          {selectedImage ? (
            <ExpoImage source={{ uri: selectedImage }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
          )}
        </TouchableOpacity>
        <Text className="text-sm text-gray-500 mt-2">Tap to add avatar</Text>
      </View>
      
      {/* Name input */}
      <Controller
        control={control}
        name="name"
        rules={{
          required: 'Group name is required',
          minLength: { value: 3, message: 'Minimum 3 characters' },
          maxLength: { value: 50, message: 'Maximum 50 characters' }
        }}
        render={({ field }) => (
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2">Group Name *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="e.g., Da Nang Adventure"
              value={field.value}
              onChangeText={field.onChange}
              maxLength={50}
            />
            <View className="flex-row justify-between mt-1">
              {errors.name && (
                <Text className="text-red-500 text-xs">{errors.name.message}</Text>
              )}
              <Text className="text-gray-400 text-xs ml-auto">{name.length}/50</Text>
            </View>
          </View>
        )}
      />
      
      {/* Description textarea */}
      <Controller
        control={control}
        name="description"
        rules={{ maxLength: { value: 200, message: 'Maximum 200 characters' } }}
        render={({ field }) => (
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-2">Description (optional)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="What's this group about?"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text className="text-gray-400 text-xs mt-1">{description.length}/200</Text>
          </View>
        )}
      />
      
      <TouchableOpacity
        className={`py-4 rounded-lg ${name.length >= 3 ? 'bg-primary' : 'bg-gray-300'}`}
        onPress={handleSubmit(onNext)}
        disabled={name.length < 3}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Next Step →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
```

**Acceptance Criteria**:
- [ ] Form validation works
- [ ] Character counters update
- [ ] Avatar picker works
- [ ] Next button disabled until valid

---

### 5.4 Create CustomizeStep Component

**File**: `components/group/wizard/CustomizeStep.tsx` (NEW)

```typescript
const THEME_COLORS = [
  { color: '#3B82F6', name: 'Blue', emoji: '🔵' },
  { color: '#EF4444', name: 'Red', emoji: '🔴' },
  { color: '#F59E0B', name: 'Orange', emoji: '🟠' },
  { color: '#10B981', name: 'Green', emoji: '🟢' },
  { color: '#8B5CF6', name: 'Purple', emoji: '🟣' },
];

export function CustomizeStep({ data, onNext, onBack }: StepProps) {
  const [themeColor, setThemeColor] = useState(data.themeColor);
  const [isPro, setIsPro] = useState(data.isPro);
  
  return (
    <ScrollView className="flex-1 px-4 py-6">
      <Text className="text-2xl font-bold mb-2">Customize Your Group</Text>
      <Text className="text-gray-600 mb-6">Make it yours</Text>
      
      {/* Theme color selector */}
      <View className="mb-6">
        <Text className="text-sm font-semibold mb-3">Theme Color</Text>
        <View className="flex-row flex-wrap gap-3">
          {THEME_COLORS.map((theme) => (
            <TouchableOpacity
              key={theme.color}
              onPress={() => setThemeColor(theme.color)}
              className={`flex-row items-center px-4 py-3 rounded-lg border-2 ${
                themeColor === theme.color ? 'border-gray-800' : 'border-gray-200'
              }`}
            >
              <Text className="text-xl mr-2">{theme.emoji}</Text>
              <Text className="font-medium">{theme.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Group type selector */}
      <View className="mb-6">
        <Text className="text-sm font-semibold mb-3">Group Type</Text>
        
        <TouchableOpacity
          onPress={() => setIsPro(false)}
          className={`p-4 rounded-lg border-2 mb-3 ${
            !isPro ? 'border-gray-800 bg-gray-50' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">🆓 Free Group</Text>
            {!isPro && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
          </View>
          <Text className="text-gray-600">Basic features for trip planning</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setIsPro(true)}
          className={`p-4 rounded-lg border-2 ${
            isPro ? 'border-gray-800 bg-gray-50' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">💎 Pro Group</Text>
            {isPro && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
          </View>
          <Text className="text-gray-600 mb-2">AI chatbots and advanced analytics</Text>
          <Text className="text-xs text-gray-500">ℹ️ Can upgrade later</Text>
        </TouchableOpacity>
      </View>
      
      <View className="flex-row gap-3 mt-auto">
        <TouchableOpacity
          className="flex-1 bg-gray-200 py-4 rounded-lg"
          onPress={onBack}
        >
          <Text className="text-center font-semibold">← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-primary py-4 rounded-lg"
          onPress={() => onNext({ themeColor, isPro })}
        >
          <Text className="text-white text-center font-semibold">Next →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

**Acceptance Criteria**:
- [ ] Theme selection works
- [ ] Group type selection works
- [ ] Back button works
- [ ] Next button works

---

### 5.5 Create AddMembersStep Component

**File**: `components/group/wizard/AddMembersStep.tsx` (NEW)

**Implementation**:
- User search (similar to existing CreateGroupModal)
- Selected members list with role assignment
- Skip button for creating group without members

**Acceptance Criteria**:
- [ ] Search works with debounce
- [ ] Can assign roles (CO_LEADER or MEMBER)
- [ ] Can remove selected members
- [ ] Skip button works
- [ ] Back button works

---

### 5.6 Create ReviewStep Component

**File**: `components/group/wizard/ReviewStep.tsx` (NEW)

```typescript
export function ReviewStep({ data, onBack, onCreate }: StepProps) {
  const [isCreating, setIsCreating] = useState(false);
  const createGroupMutation = useCreateGroup();
  
  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const result = await createGroupMutation.mutateAsync({
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        theme_color: data.themeColor,
        isPro: data.isPro,
        member_ids: data.members.map(m => m.user.id)
      });
      
      // Navigate to success screen
      router.replace(`/groups/create-success?groupId=${result.id}&groupName=${result.name}`);
    } catch (error) {
      showErrorToast('Failed to create group', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <ScrollView className="flex-1 px-4 py-6">
      <Text className="text-2xl font-bold mb-2">Review & Confirm</Text>
      <Text className="text-gray-600 mb-6">Everything look good?</Text>
      
      {/* Preview card */}
      <View className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
        <View className="items-center mb-4">
          {data.avatar ? (
            <ExpoImage
              source={{ uri: data.avatar }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          ) : (
            <View 
              className="bg-gray-200 items-center justify-center"
              style={{ width: 100, height: 100, borderRadius: 50 }}
            >
              <Text className="text-4xl">{data.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        
        <Text className="text-2xl font-bold text-center mb-2">{data.name}</Text>
        {data.description && (
          <Text className="text-gray-600 text-center mb-4">\"{data.description}\"</Text>
        )}
        
        <View className="space-y-2">
          <DetailRow icon="color-palette" label="Theme" value={getThemeName(data.themeColor)} />
          <DetailRow icon="star" label="Type" value={data.isPro ? 'Pro Group' : 'Free Group'} />
          <DetailRow
            icon="people"
            label="Members"
            value={data.members.length === 0 ? 'Just you' : `You + ${data.members.length} other${data.members.length > 1 ? 's' : ''}`}
          />
        </View>
      </View>
      
      {/* Confirmation items */}
      <View className="bg-green-50 p-4 rounded-lg mb-6">
        <ConfirmationItem text="General chat will be created automatically" />
        <ConfirmationItem text="You will be the group leader" />
        {data.members.length > 0 && (
          <ConfirmationItem text="Members will receive invitation" />
        )}
      </View>
      
      <View className="flex-row gap-3">
        <TouchableOpacity
          className="bg-gray-200 px-4 py-4 rounded-lg"
          onPress={onBack}
          disabled={isCreating}
        >
          <Text className="text-center font-semibold">← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-primary py-4 rounded-lg"
          onPress={handleCreate}
          disabled={isCreating}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isCreating ? 'Creating...' : 'Create Group ✓'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

**Acceptance Criteria**:
- [ ] Preview shows all entered data
- [ ] Create button works
- [ ] Loading state shows
- [ ] Navigates to success screen

---

### 5.7 Create Success Screen

**File**: `app/groups/create-success.tsx` (NEW)

```typescript
export default function CreateGroupSuccess() {
  const { groupId, groupName } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(`/groups/${groupId}`);
    }, 3000);
    return () => clearTimeout(timer);
  }, [groupId]);
  
  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
      <View className="items-center">
        <View className="bg-green-100 rounded-full p-8 mb-6">
          <Ionicons name="checkmark" size={64} color="#10B981" />
        </View>
        
        <Text className="text-3xl font-bold mb-4">Success!</Text>
        <Text className="text-gray-600 text-center mb-8">
          Your group "{groupName}" has been created!
        </Text>
        
        <View className="w-full space-y-3">
          <TouchableOpacity
            className="bg-primary py-4 rounded-lg"
            onPress={() => router.replace(`/groups/${groupId}/chat`)}
          >
            <Text className="text-white text-center font-semibold text-lg">
              💬 Start Chatting
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="border-2 border-primary py-4 rounded-lg"
            onPress={() => router.replace(`/groups/${groupId}`)}
          >
            <Text className="text-primary text-center font-semibold text-lg">
              👥 View Group
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

**Acceptance Criteria**:
- [ ] Success animation/icon shows
- [ ] Group name displayed
- [ ] Navigation buttons work
- [ ] Auto-navigates after 3s

---

## Deliverables

- ✅ Multi-step wizard container
- ✅ Progress indicator
- ✅ Step 1: Basic info with validation
- ✅ Step 2: Theme & type customization
- ✅ Step 3: Add members (optional)
- ✅ Step 4: Review & preview
- ✅ Success screen
- ✅ Back/Skip navigation

## Dependencies

- Phase 1 components
- Existing hooks (useCreateGroup)
- Form validation library (react-hook-form)

## Testing

### Manual Testing
- [ ] Complete wizard flow end-to-end
- [ ] Back navigation preserves data
- [ ] Skip members step works
- [ ] Validation prevents invalid submissions
- [ ] Success screen shows and auto-navigates
- [ ] Close confirmation when data entered

## Notes

- Replace existing CreateGroupModal with this wizard
- Consider adding progress save (future enhancement)
- Add exit confirmation if user has entered data
