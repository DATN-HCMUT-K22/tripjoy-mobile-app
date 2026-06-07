import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '@/services/media';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useAppDialog } from '@/hooks/useAppDialog';

interface ReceiptImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  onImagePress?: (index: number) => void;
  disabled?: boolean;
}

export function ReceiptImagePicker({
  images,
  onChange,
  maxImages = 3,
  onImagePress,
  disabled = false,
}: ReceiptImagePickerProps) {
  const [uploading, setUploading] = useState(false);
  const { dialog, showWarning } = useAppDialog();

  const handleAddImage = async () => {
    if (disabled) return;
    if (images.length >= maxImages) {
      showWarning('Giới hạn ảnh', `Chỉ được tải tối đa ${maxImages} ảnh hóa đơn`);
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
    if (disabled) return;
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
            style={{
              width: 100,
              height: 100,
              borderRadius: 8,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <TouchableOpacity
              onPress={() => onImagePress?.(index)}
              disabled={!onImagePress}
              style={{ width: "100%", height: "100%" }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri }}
                style={{ width: "100%", height: "100%", resizeMode: 'cover' }}
              />
            </TouchableOpacity>
            {!disabled && (
              <TouchableOpacity
                onPress={() => handleRemoveImage(index)}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  borderRadius: 12,
                  padding: 2,
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        ))}

        {images.length < maxImages && !disabled && (
          <TouchableOpacity
            onPress={handleAddImage}
            disabled={uploading}
            style={{
              width: 100,
              height: 100,
              minWidth: 100,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderStyle: "dashed",
              backgroundColor: "#F9FAFB",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            {uploading ? (
              <ActivityIndicator color="#34B27D" size="small" />
            ) : (
              <Ionicons name="add" size={32} color="#999" />
            )}
          </TouchableOpacity>
        )}
      </View>
      {dialog}
    </View>
  );
}
