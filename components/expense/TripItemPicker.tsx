import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppBottomSheet } from '@/components/common/AppBottomSheet';
import { TripItemResponse } from '@/services/itineraries';

interface TripItemPickerProps {
  visible: boolean;
  onClose: () => void;
  tripItems: TripItemResponse[];
  selectedItemId?: string | null;
  onSelect: (itemId: string | null) => void;
}

export function TripItemPicker({
  visible,
  onClose,
  tripItems,
  selectedItemId,
  onSelect,
}: TripItemPickerProps) {
  const handleSelect = (itemId: string | null) => {
    onSelect(itemId);
    onClose();
  };

  const formatItemTime = (startTime?: string) => {
    if (!startTime) return '';
    try {
      const date = new Date(startTime);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      return `${hours}:${minutes}, ${day}/${month}`;
    } catch {
      return '';
    }
  };

  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      snapPoints={['50%', '75%']}
      title="Chọn địa điểm"
    >
      <View className="px-4 py-2">
        {/* No location option */}
        <TouchableOpacity
          onPress={() => handleSelect(null)}
          className={`flex-row items-center p-4 mb-3 rounded-xl border-2 ${
            selectedItemId === null
              ? 'border-[#2BB673] bg-[#2BB673]/5'
              : 'border-gray-200 bg-white'
          }`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            className={`w-12 h-12 rounded-full items-center justify-center ${
              selectedItemId === null ? 'bg-[#2BB673]' : 'bg-gray-100'
            }`}
          >
            <Ionicons
              name="close-circle-outline"
              size={24}
              color={selectedItemId === null ? '#fff' : '#6B7280'}
            />
          </View>
          <View className="flex-1 ml-3">
            <Text
              className={`text-base font-semibold ${
                selectedItemId === null ? 'text-[#2BB673]' : 'text-gray-700'
              }`}
            >
              Không gắn địa điểm
            </Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              Chi phí chung, không liên quan đến địa điểm cụ thể
            </Text>
          </View>
          {selectedItemId === null && (
            <Ionicons name="checkmark-circle" size={24} color="#2BB673" />
          )}
        </TouchableOpacity>

        {/* Trip items list */}
        <Text className="text-sm font-semibold text-gray-500 mb-2 mt-2">
          Các địa điểm trong lịch trình
        </Text>

        {tripItems.length === 0 ? (
          <View className="py-8 items-center">
            <Ionicons name="location-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 mt-2 text-sm">
              Chưa có địa điểm nào
            </Text>
          </View>
        ) : (
          tripItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            const locationName = item.location?.name || 'Không có tên';
            const timeStr = formatItemTime(item.start_time);

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleSelect(item.id!)}
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
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    isSelected ? 'bg-[#2BB673]' : 'bg-gray-100'
                  }`}
                >
                  <Ionicons
                    name="location"
                    size={22}
                    color={isSelected ? '#fff' : '#6B7280'}
                  />
                </View>
                <View className="flex-1 ml-3">
                  <Text
                    className={`text-base font-semibold ${
                      isSelected ? 'text-[#2BB673]' : 'text-gray-800'
                    }`}
                    numberOfLines={1}
                  >
                    {locationName}
                  </Text>
                  {timeStr && (
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {timeStr}
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
