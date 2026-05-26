import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { AppBottomSheet } from '@/components/common/AppBottomSheet';
import { resolveUserAvatarUri } from '@/utils/userAvatar';

export interface MemberOption {
  id: string;
  fullName: string;
  username?: string;
  avatarUrl?: string | null;
}

interface MemberPickerProps {
  visible: boolean;
  onClose: () => void;
  members: MemberOption[];
  selectedMemberId?: string;
  onSelect: (memberId: string) => void;
  title?: string;
}

export function MemberPicker({
  visible,
  onClose,
  members,
  selectedMemberId,
  onSelect,
  title = 'Chọn người thanh toán',
}: MemberPickerProps) {
  const handleSelect = (memberId: string) => {
    onSelect(memberId);
    onClose();
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['40%', '60%']}
      title={title}
    >
      <View className="px-4 py-2">
        {members.length === 0 ? (
          <View className="py-8 items-center">
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-2 text-sm">
              Chưa có thành viên nào
            </Text>
          </View>
        ) : (
          members.map((member) => {
            const isSelected = selectedMemberId === member.id;
            const avatarUri = resolveUserAvatarUri(member.avatarUrl);

            return (
              <TouchableOpacity
                key={member.id}
                onPress={() => handleSelect(member.id)}
                className={`flex-row items-center p-4 mb-2 rounded-xl border ${
                  isSelected
                    ? 'border-[#2BB673] bg-[#2BB673]/5'
                    : 'border-gray-200 bg-white'
                }`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    className="w-12 h-12 rounded-full"
                    contentFit="cover"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
                    <Ionicons name="person" size={24} color="#6B7280" />
                  </View>
                )}
                <View className="flex-1 ml-3">
                  <Text
                    className={`text-base font-semibold ${
                      isSelected ? 'text-[#2BB673]' : 'text-gray-800'
                    }`}
                    numberOfLines={1}
                  >
                    {member.fullName}
                  </Text>
                  {member.username && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      @{member.username}
                    </Text>
                  )}
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={24} color="#2BB673" />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </AppBottomSheet>
  );
}
