import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, SafeAreaView, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSearchHotels } from '@/hooks/useHotels';
import { HotelCard } from '@/components/hotel/HotelCard';
import { HotelDetailModal } from '@/components/hotel/HotelDetailModal';
import type { HotelSearchResult } from '@/services/hotels';
import { Ionicons } from '@expo/vector-icons';
import { SharedHeader } from '@/components/common/SharedHeader';

export default function HotelsScreen() {
  const router = useRouter();
  const { id, cityName } = useLocalSearchParams<{ id: string; cityName?: string }>();
  const { width } = useWindowDimensions();
  
  // Loại bỏ chữ "Khám phá " ở đầu chuỗi nếu có
  const processedCityName = cityName?.replace(/Khám phá/gi, '')?.trim();
  
  const { data: hotels, isLoading, isError, refetch } = useSearchHotels(processedCityName);
  
  const [selectedHotel, setSelectedHotel] = useState<HotelSearchResult | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <SharedHeader 
        centerElement={
          <View style={{ width: width - 140, alignItems: 'center', justifyContent: 'center' }}>
            <Text 
              style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Khách sạn
            </Text>
          </View>
        }
        showBackButton={true}
        onBackPress={() => router.back()} 
      />
      
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#DC2626" />
          <Text style={styles.loadingText}>Đang tìm khách sạn tốt nhất...</Text>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Không thể tải danh sách khách sạn</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : hotels && hotels.length > 0 ? (
        <FlatList
          data={hotels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <HotelCard 
              hotel={item} 
              onPress={(hotel) => {
                setSelectedHotel(hotel);
              }} 
            />
          )}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="bed-outline" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>Không tìm thấy khách sạn nào</Text>
        </View>
      )}

      <HotelDetailModal 
        visible={!!selectedHotel} 
        onClose={() => setSelectedHotel(null)} 
        hotel={selectedHotel} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#4B5563',
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
});
