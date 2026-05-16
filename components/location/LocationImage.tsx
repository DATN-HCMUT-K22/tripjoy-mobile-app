import { expoImageSourceForGoogleRaster } from '@/utils/googlePlaceImageSource';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LocationResponse } from '@/services/itineraries';
import { Location } from '@/types/trip';
import { getLocationImageUrlAsync, getLocationImageUrl } from '@/utils/locationImages';

interface LocationImageProps {
  location?: LocationResponse | Location | null;
  style?: ImageStyle | ImageStyle[];
  containerStyle?: any;
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
  showAiBadge?: boolean;
}

/**
 * Component hiển thị ảnh địa điểm.
 * Tự động tìm provider_id để lấy ảnh từ Google Places API (async).
 * Fallback sang content URL -> Static Map -> Placeholder Icon.
 */
export const LocationImage: React.FC<LocationImageProps> = ({
  location,
  style,
  containerStyle,
  placeholderIcon = 'location',
  showAiBadge,
}) => {
  const [imageUrl, setImageUrl] = useState<string | undefined>(getLocationImageUrl(location));
  const [loading, setLoading] = useState(false);

  // Hiển thị badge AI nếu chủ động truyền vào hoặc nếu không có object location (thường là gợi ý AI)
  const shouldShowAiBadge = showAiBadge ?? !location;

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      if (!location) return;
      
      const providerId = (location as any).provider_id || (location as any).providerId;
      const provider = (location as any).provider || '';
      
      // Stability check: Avoid re-resolving if we already have a URL for this ID/Coords
      // and the location object is effectively the same.
      const lat = (location as any).lat ?? (location as any).latitude;
      const lng = (location as any).lng ?? (location as any).longitude;
      
      const isGoogle = !provider || 
                       String(provider).toUpperCase() === 'NONE' ||
                       String(provider).toUpperCase() === 'GOOGLE_MAPS' || 
                       String(provider).toLowerCase().includes('google') ||
                       (typeof providerId === 'string' && providerId.startsWith('ChI'));

      // Chỉ cần có provider_id HOẶC được xác định là từ Google, ta sẽ thử fetch ảnh
      if (providerId || isGoogle) {
        if (!imageUrl) setLoading(true); // Only show loading if we don't have a sync URL
        try {
          const url = await getLocationImageUrlAsync(location as any);
          if (isMounted && url && url !== imageUrl) {
            setImageUrl(url);
          }
        } catch (error) {
          console.warn('[LocationImage] Error:', error);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        const syncUrl = getLocationImageUrl(location as any);
        if (isMounted && syncUrl && syncUrl !== imageUrl) {
          setImageUrl(syncUrl);
        }
      }
    };

    void resolveImage();

    return () => {
      isMounted = false;
    };
  }, [
    (location as any)?.id, 
    (location as any)?.provider_id, 
    (location as any)?.providerId, 
    (location as any)?.lat, 
    (location as any)?.latitude, 
    (location as any)?.lng, 
    (location as any)?.longitude
  ]);

  return (
    <View style={[styles.container, containerStyle]}>
      {imageUrl ? (
        <Image
          source={expoImageSourceForGoogleRaster(imageUrl)}
          style={[styles.image, style]}
          contentFit="cover"
          transition={300}
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
          onError={() => {
            console.log(`[LocationImage] Failed to load image: ${imageUrl?.substring(0, 40)}...`);
            // Fallback to a different map provider if Google Static Map fails
            if (imageUrl?.includes("maps.googleapis.com") || imageUrl?.includes("places.googleapis.com")) {
              const lat = (location as any)?.latitude || (location as any)?.lat;
              const lng = (location as any)?.longitude || (location as any)?.lng;
              if (lat && lng) {
                // Use Yandex Static Maps as a reliable fallback (no key required for low traffic)
                const fallback = `https://static-maps.yandex.ru/1.x/?ll=${lng},${lat}&z=14&l=map&size=450,450`;
                setImageUrl(fallback);
                return;
              }
            }
            setImageUrl(undefined);
          }}
        />
      ) : (
        <View style={[styles.placeholder, style]}>
          <Ionicons name={placeholderIcon} size={32} color="#FFFFFF" />
        </View>
      )}
      
      {shouldShowAiBadge && (
        <View style={styles.suggestionBadge}>
          <Text style={styles.suggestionText}>GỢI Ý AI</Text>
        </View>
      )}

      {loading && !imageUrl && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator color="#34B27D" size="small" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2BB673',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    backgroundColor: 'rgba(243, 244, 246, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    zIndex: 10,
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
