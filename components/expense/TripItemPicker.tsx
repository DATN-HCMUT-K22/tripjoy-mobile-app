import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SlideUpModal } from '@/components/common/SlideUpModal';
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
    <SlideUpModal
      visible={visible}
      onClose={onClose}
      title="Chọn địa điểm"
    >
      <ScrollView style={{ paddingHorizontal: 16, paddingVertical: 8, maxHeight: 400 }}>
        {/* No location option */}
        <TouchableOpacity
          onPress={() => handleSelect(null)}
          style={{
            flexDirection: 'row', alignItems: 'center',
            padding: 16, marginBottom: 12, borderRadius: 12,
            borderWidth: 2,
            borderColor: selectedItemId === null ? '#2BB673' : '#E5E7EB',
            backgroundColor: selectedItemId === null ? 'rgba(43, 182, 115, 0.05)' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <View
            style={{
              width: 48, height: 48, borderRadius: 9999,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: selectedItemId === null ? '#2BB673' : '#F3F4F6',
            }}
          >
            <Ionicons
              name="close-circle-outline"
              size={24}
              color={selectedItemId === null ? '#fff' : '#6B7280'}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text
              style={{ fontSize: 16, fontWeight: '600', color: selectedItemId === null ? '#2BB673' : '#374151' }}
            >
              Không gắn địa điểm
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Chi phí chung, không liên quan đến địa điểm cụ thể
            </Text>
          </View>
          {selectedItemId === null && (
            <Ionicons name="checkmark-circle" size={24} color="#2BB673" />
          )}
        </TouchableOpacity>

        {/* Trip items list */}
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginTop: 8 }}>
          Các địa điểm trong lịch trình
        </Text>

        {tripItems.length === 0 ? (
          <View style={{ paddingVertical: 32, alignItems: 'center' }}>
            <Ionicons name="location-outline" size={48} color="#D1D5DB" />
            <Text style={{ color: '#9CA3AF', marginTop: 8, fontSize: 14 }}>
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
                <View
                  style={{
                    width: 48, height: 48, borderRadius: 9999,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: isSelected ? '#2BB673' : '#F3F4F6',
                  }}
                >
                  <Ionicons
                    name="location"
                    size={22}
                    color={isSelected ? '#fff' : '#6B7280'}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{ fontSize: 16, fontWeight: '600', color: isSelected ? '#2BB673' : '#1F2937' }}
                    numberOfLines={1}
                  >
                    {locationName}
                  </Text>
                  {timeStr && (
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
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
      </ScrollView>
    </SlideUpModal>
  );
}
