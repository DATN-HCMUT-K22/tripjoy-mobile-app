import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { SlideUpModal } from '@/components/common/SlideUpModal';
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
    <SlideUpModal
      visible={visible}
      onClose={onClose}
      title={title}
    >
      <ScrollView style={{ paddingHorizontal: 16, paddingVertical: 8, maxHeight: 400 }}>
        {members.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Ionicons name="people-outline" size={48} color="#D1D5DB" />
            <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>
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
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  padding: 16, marginBottom: 8, borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isSelected ? '#2BB673' : '#E5E7EB',
                  backgroundColor: isSelected ? 'rgba(43, 182, 115, 0.05)' : '#FFFFFF',
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
                    style={{ width: 48, height: 48, borderRadius: 9999, resizeMode: 'cover' }}
                  />
                ) : (
                  <View style={{ width: 48, height: 48, borderRadius: 9999, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="person" size={24} color="#6B7280" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: '600', color: isSelected ? '#2BB673' : '#1F2937' }}
                    numberOfLines={1}
                  >
                    {member.fullName}
                  </Text>
                  {member.username && (
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
      </ScrollView>
    </SlideUpModal>
  );
}
