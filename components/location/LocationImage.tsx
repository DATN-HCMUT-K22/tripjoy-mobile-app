import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
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
  console.log(`[RENDER] LocationImage for: ${location?.name}`);
  const [imageUrl, setImageUrl] = useState<string | undefined>(getLocationImageUrl(location));
  const [loading, setLoading] = useState(false);

  // Hiển thị badge AI nếu chủ động truyền vào hoặc nếu không có object location (thường là gợi ý AI)
  const shouldShowAiBadge = showAiBadge ?? !location;

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      if (!location) return;
      
      const providerId = location.provider_id;
      const provider = location.provider || '';
      const isGoogle = provider.toUpperCase() === 'GOOGLE_MAPS' || 
                       provider.toLowerCase().includes('google');

      console.log(`\n🚀 [LocationImage] Resolving for: ${location.name || 'unnamed'}`);
      console.log(`   - Provider ID: ${providerId || 'NONE'}`);
      console.log(`   - Provider: ${provider || 'NONE'}`);

      // Chỉ cần có provider_id HOẶC được xác định là từ Google, ta sẽ thử fetch ảnh
      if (providerId || isGoogle) {
        setLoading(true);
        try {
          const url = await getLocationImageUrlAsync(location);
          if (isMounted && url) {
            console.log(`   - ✅ [RESOLVED URL]: ${url.substring(0, 60)}...`);
            setImageUrl(url);
          }
        } catch (error) {
          console.warn('[LocationImage] Error:', error);
        } finally {
          if (isMounted) setLoading(false);
        }
      } else {
        console.log(`   - ℹ️ No Google Provider ID, using fallback extraction.`);
        const syncUrl = getLocationImageUrl(location);
        if (isMounted && syncUrl) {
          setImageUrl(syncUrl);
        }
      }
    };

    void resolveImage();

    return () => {
      isMounted = false;
    };
  }, [location]);

  return (
    <View style={[styles.container, containerStyle]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, style]}
          contentFit="cover"
          transition={300}
          placeholder={{ blurhash: 'LGF5]+Yk^6#M@-5c,1J5@[or[Q6.' }}
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
