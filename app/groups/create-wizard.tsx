/**
 * Multi-Step Group Creation Wizard
 * 4-step flow: Basic Info → Customize → Add Members → Review
 */

import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image as ExpoImage } from 'expo-image';
import { useCreateGroup } from '@/hooks/useGroups';
import { searchService } from '@/services/search';
import { UserSimpleResponse } from '@/types/search';
import { useDebounce } from '@/hooks/useDebounce';
import Toast from 'react-native-toast-message';
import { resolveUserAvatarUri } from '@/utils/userAvatar';

type WizardStep = 'basic' | 'customize' | 'members' | 'review';
type GroupMemberRole = 'LEADER' | 'CO_LEADER' | 'MEMBER';

interface WizardData {
  name: string;
  description: string;
  avatar?: string;
  themeColor: string;
  isPro: boolean;
  members: Array<{ user: UserSimpleResponse; role: GroupMemberRole }>;
}

const THEME_COLORS = [
  { color: '#3B82F6', name: 'Xanh dương', emoji: '🔵' },
  { color: '#EF4444', name: 'Đỏ', emoji: '🔴' },
  { color: '#F59E0B', name: 'Cam', emoji: '🟠' },
  { color: '#10B981', name: 'Xanh lá', emoji: '🟢' },
  { color: '#8B5CF6', name: 'Tím', emoji: '🟣' },
];

function WizardHeader({ step, progress, onBack, onClose }: any) {
  const stepLabels = {
    basic: 'Thông tin cơ bản',
    customize: 'Tùy chỉnh',
    members: 'Thêm thành viên',
    review: 'Xem lại',
  };

  return (
    <View className="border-b border-gray-200">
      <View className="flex-row items-center justify-between px-4 py-3">
        {step !== 'basic' ? (
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}

        <Text className="text-lg font-bold">{stepLabels[step]}</Text>

        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <View className="h-1 bg-gray-200">
        <View className="h-full bg-primary" style={{ width: `${progress * 100}%` }} />
      </View>
    </View>
  );
}

export default function CreateGroupWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('basic');
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    description: '',
    themeColor: '#34B27D',
    isPro: false,
    members: [],
  });

  const progress = { basic: 0.25, customize: 0.5, members: 0.75, review: 1.0 }[step];

  const handleBack = () => {
    const flow: WizardStep[] = ['basic', 'customize', 'members', 'review'];
    const currentIndex = flow.indexOf(step);
    if (currentIndex > 0) {
      setStep(flow[currentIndex - 1]);
    }
  };

  const handleClose = () => {
    if (wizardData.name) {
      // TODO: Show confirmation if data entered
    }
    router.back();
  };

  const updateAndNext = (nextStep: WizardStep, updates: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
    setStep(nextStep);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <WizardHeader
        step={step}
        progress={progress}
        onBack={handleBack}
        onClose={handleClose}
      />

      {step === 'basic' && (
        <BasicInfoStep data={wizardData} onNext={(data) => updateAndNext('customize', data)} />
      )}
      {step === 'customize' && (
        <CustomizeStep data={wizardData} onNext={(data) => updateAndNext('members', data)} />
      )}
      {step === 'members' && (
        <AddMembersStep
          data={wizardData}
          onNext={(data) => updateAndNext('review', data)}
          onSkip={() => updateAndNext('review', {})}
        />
      )}
      {step === 'review' && (
        <ReviewStep data={wizardData} />
      )}
    </SafeAreaView>
  );
}

function BasicInfoStep({ data, onNext }: any) {
  const { control, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { name: data.name, description: data.description }
  });

  const [selectedImage, setSelectedImage] = useState(data.avatar);
  const name = watch('name');
  const description = watch('description');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView className="flex-1 px-4 py-6">
      <Text className="text-2xl font-bold mb-2">Tạo nhóm mới</Text>
      <Text className="text-gray-600 mb-6">Bắt đầu với thông tin cơ bản</Text>

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
        <Text className="text-sm text-gray-500 mt-2">Chạm để thêm ảnh</Text>
      </View>

      <Controller
        control={control}
        name="name"
        rules={{
          required: 'Tên nhóm là bắt buộc',
          minLength: { value: 3, message: 'Tối thiểu 3 ký tự' },
          maxLength: { value: 50, message: 'Tối đa 50 ký tự' }
        }}
        render={({ field }) => (
          <View className="mb-4">
            <Text className="text-sm font-semibold mb-2">Tên nhóm *</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="VD: Chuyến đi Đà Nẵng"
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

      <Controller
        control={control}
        name="description"
        rules={{ maxLength: { value: 200, message: 'Tối đa 200 ký tự' } }}
        render={({ field }) => (
          <View className="mb-6">
            <Text className="text-sm font-semibold mb-2">Mô tả (tùy chọn)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              placeholder="Nhóm này về gì?"
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
        onPress={handleSubmit((formData) => onNext({ ...formData, avatar: selectedImage }))}
        disabled={name.length < 3}
      >
        <Text className="text-white text-center font-semibold text-lg">
          Tiếp theo →
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function CustomizeStep({ data, onNext }: any) {
  const [themeColor, setThemeColor] = useState(data.themeColor);
  const [isPro, setIsPro] = useState(data.isPro);

  return (
    <ScrollView className="flex-1 px-4 py-6">
      <Text className="text-2xl font-bold mb-2">Tùy chỉnh nhóm</Text>
      <Text className="text-gray-600 mb-6">Làm cho nó trở thành của bạn</Text>

      <View className="mb-6">
        <Text className="text-sm font-semibold mb-3">Màu chủ đề</Text>
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

      <View className="mb-6">
        <Text className="text-sm font-semibold mb-3">Loại nhóm</Text>

        <TouchableOpacity
          onPress={() => setIsPro(false)}
          className={`p-4 rounded-lg border-2 mb-3 ${
            !isPro ? 'border-gray-800 bg-gray-50' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">🆓 Nhóm miễn phí</Text>
            {!isPro && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
          </View>
          <Text className="text-gray-600">Tính năng cơ bản cho lập kế hoạch</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsPro(true)}
          className={`p-4 rounded-lg border-2 ${
            isPro ? 'border-gray-800 bg-gray-50' : 'border-gray-200'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">💎 Nhóm Pro</Text>
            {isPro && <Ionicons name="checkmark-circle" size={24} color="#10B981" />}
          </View>
          <Text className="text-gray-600 mb-2">AI chatbot và phân tích nâng cao</Text>
          <Text className="text-xs text-gray-500">ℹ️ Có thể nâng cấp sau</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-primary py-4 rounded-lg"
        onPress={() => onNext({ themeColor, isPro })}
      >
        <Text className="text-white text-center font-semibold text-lg">Tiếp theo →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function AddMembersStep({ data, onNext, onSkip }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Array<{ user: UserSimpleResponse; role: GroupMemberRole }>>(data.members);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSimpleResponse[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Search users
  useState(() => {
    if (debouncedSearch.length >= 2) {
      setIsSearching(true);
      searchService.searchUsers(debouncedSearch)
        .then(res => {
          if (res.code === 1000 || res.code === 0) {
            const selectedIds = new Set(selectedMembers.map(m => m.user.id));
            setSearchResults((res.data || []).filter(u => !selectedIds.has(u.id)));
          }
        })
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  });

  const addMember = (user: UserSimpleResponse) => {
    setSelectedMembers([...selectedMembers, { user, role: 'MEMBER' }]);
    setSearchQuery('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeMember = (userId: string) => {
    setSelectedMembers(selectedMembers.filter(m => m.user.id !== userId));
  };

  const updateRole = (userId: string, role: GroupMemberRole) => {
    setSelectedMembers(selectedMembers.map(m =>
      m.user.id === userId ? { ...m, role } : m
    ));
  };

  return (
    <ScrollView className="flex-1 px-4 py-6">
      <Text className="text-2xl font-bold mb-2">Thêm thành viên</Text>
      <Text className="text-gray-600 mb-4">Tùy chọn - có thể thêm sau</Text>

      <View className="flex-row items-center bg-gray-100 rounded-lg px-4 py-3 mb-4">
        <Ionicons name="search-outline" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-base"
          placeholder="Tìm người dùng..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isSearching && <ActivityIndicator className="my-4" />}

      {searchResults.length > 0 && (
        <View className="mb-4">
          {searchResults.map(user => {
            const displayName = user.fullName || user.full_name || user.username || 'User';
            return (
              <TouchableOpacity
                key={user.id}
                onPress={() => addMember(user)}
                className="flex-row items-center p-3 bg-white rounded-lg mb-2"
              >
                <ExpoImage
                  source={{ uri: resolveUserAvatarUri(user.avatarUrl || user.avatar_url, displayName) }}
                  style={{ width: 36, height: 36, borderRadius: 18, marginRight: 12 }}
                />
                <Text className="flex-1 font-medium">{displayName}</Text>
                <Text className="text-primary font-semibold">Chọn</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {selectedMembers.length > 0 && (
        <View className="mb-4">
          <Text className="text-sm font-bold mb-2">ĐÃ CHỌN ({selectedMembers.length})</Text>
          {selectedMembers.map(member => {
            const displayName = member.user.fullName || member.user.full_name || member.user.username || 'User';
            return (
              <View key={member.user.id} className="bg-white rounded-lg p-3 mb-2">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <ExpoImage
                      source={{ uri: resolveUserAvatarUri(member.user.avatarUrl || member.user.avatar_url, displayName) }}
                      style={{ width: 32, height: 32, borderRadius: 16, marginRight: 10 }}
                    />
                    <Text className="flex-1 font-medium">{displayName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeMember(member.user.id)}>
                    <Text className="text-red-500 font-medium">Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 border-2 border-primary py-4 rounded-lg"
          onPress={() => onSkip()}
        >
          <Text className="text-primary text-center font-semibold">Bỏ qua</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-primary py-4 rounded-lg"
          onPress={() => onNext({ members: selectedMembers })}
        >
          <Text className="text-white text-center font-semibold">Tiếp theo →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ReviewStep({ data }: { data: WizardData }) {
  const router = useRouter();
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
        member_ids: data.members.map(m => m.user.id),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Tạo nhóm thành công!' });
      router.replace(`/groups/${result.id}` as any);
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Không thể tạo nhóm' });
    } finally {
      setIsCreating(false);
    }
  };

  const themeName = THEME_COLORS.find(t => t.color === data.themeColor)?.name || 'Xanh';

  return (
    <ScrollView className="flex-1 px-4 py-6">
      <Text className="text-2xl font-bold mb-2">Xem lại & Xác nhận</Text>
      <Text className="text-gray-600 mb-6">Mọi thứ có ổn không?</Text>

      <View className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
        <View className="items-center mb-4">
          {data.avatar ? (
            <ExpoImage source={{ uri: data.avatar }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <View className="bg-gray-200 items-center justify-center" style={{ width: 100, height: 100, borderRadius: 50 }}>
              <Text className="text-4xl">{data.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>

        <Text className="text-2xl font-bold text-center mb-2">{data.name}</Text>
        {data.description && (
          <Text className="text-gray-600 text-center mb-4">"{data.description}"</Text>
        )}

        <View className="space-y-2">
          <View className="flex-row items-center py-2">
            <Ionicons name="color-palette" size={16} color="#9CA3AF" />
            <Text className="ml-2 text-gray-700">Màu: {themeName}</Text>
          </View>
          <View className="flex-row items-center py-2">
            <Ionicons name="star" size={16} color="#9CA3AF" />
            <Text className="ml-2 text-gray-700">{data.isPro ? 'Nhóm Pro' : 'Nhóm miễn phí'}</Text>
          </View>
          <View className="flex-row items-center py-2">
            <Ionicons name="people" size={16} color="#9CA3AF" />
            <Text className="ml-2 text-gray-700">
              {data.members.length === 0 ? 'Chỉ có bạn' : `Bạn + ${data.members.length} người khác`}
            </Text>
          </View>
        </View>
      </View>

      <View className="bg-green-50 p-4 rounded-lg mb-6">
        <Text className="text-green-800 text-sm">✓ Chat chung sẽ được tạo tự động</Text>
        <Text className="text-green-800 text-sm">✓ Bạn sẽ là trưởng nhóm</Text>
        {data.members.length > 0 && (
          <Text className="text-green-800 text-sm">✓ Thành viên sẽ nhận được thông báo</Text>
        )}
      </View>

      <TouchableOpacity
        className="bg-primary py-4 rounded-lg"
        onPress={handleCreate}
        disabled={isCreating}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {isCreating ? 'Đang tạo...' : 'Tạo nhóm ✓'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
