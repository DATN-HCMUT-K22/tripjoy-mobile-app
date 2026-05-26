import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/services/media';
import { showErrorToast, showSuccessToast } from '@/utils/toast';

interface ReceiptImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

export function ReceiptImagePicker({
  images,
  onChange,
  maxImages = 3,
}: ReceiptImagePickerProps) {
  const [uploading, setUploading] = useState(false);

  const handleAddImage = async () => {
    if (images.length >= maxImages) {
      Alert.alert('Giới hạn ảnh', `Chỉ được tải tối đa ${maxImages} ảnh hóa đơn`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);

        const uploaded = await uploadImage({
          fileUri: result.assets[0].uri,
          folder: 'expense-receipts',
          compress: true,
        });

        onChange([...images, uploaded.url]);
        showSuccessToast('Đã tải ảnh lên');
      }
    } catch (error) {
      console.error('[ReceiptImagePicker] Upload error:', error);
      showErrorToast('Lỗi tải ảnh', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <View>
      <View className="flex-row items-center mb-2">
        <Text className="text-sm font-semibold text-gray-700 flex-1">
          Ảnh hóa đơn
        </Text>
        <Text className="text-xs text-gray-500">
          {images.length}/{maxImages}
        </Text>
      </View>

      <View className="flex-row flex-wrap" style={{ gap: 12 }}>
        {images.map((uri, index) => (
          <View
            key={index}
            className="relative"
            style={{
              width: 100,
              height: 100,
            }}
          >
            <Image
              source={{ uri }}
              className="w-full h-full rounded-xl"
              contentFit="cover"
            />
            <TouchableOpacity
              onPress={() => handleRemoveImage(index)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 items-center justify-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {images.length < maxImages && (
          <TouchableOpacity
            onPress={handleAddImage}
            disabled={uploading}
            className="items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50"
            style={{
              width: 100,
              height: 100,
            }}
          >
            {uploading ? (
              <ActivityIndicator color="#2BB673" size="small" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 mt-1">Thêm ảnh</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
