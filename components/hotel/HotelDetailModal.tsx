import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { HotelSearchResult } from '@/services/hotels';

interface HotelDetailModalProps {
  visible: boolean;
  onClose: () => void;
  hotel: HotelSearchResult | null;
}

export function HotelDetailModal({ visible, onClose, hotel }: HotelDetailModalProps) {
  if (!hotel) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header Image */}
          <View style={styles.imageContainer}>
            {hotel.image_url ? (
              <Image
                source={{ uri: hotel.image_url }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={40} color="#D1D5DB" />
              </View>
            )}
            
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>{hotel.name || "Khách sạn"}</Text>
            
            <View style={styles.addressRow}>
              <Ionicons name="location" size={18} color="#DC2626" style={styles.addressIcon} />
              <Text style={styles.addressText}>{hotel.label || "Địa chỉ không có sẵn"}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={() => {
                const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(hotel.name + ' ' + (hotel.label || ''))}`;
                Linking.openURL(searchUrl);
              }}
            >
              <Text style={styles.bookButtonText}>Tìm kiếm trên Google</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  addressIcon: {
    marginTop: 2,
    marginRight: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
