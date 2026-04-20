/**
 * AppBottomSheet Component
 * Reusable bottom sheet wrapper with consistent styling
 */

import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: string[];
  title?: string;
  children: React.ReactNode;
  enablePanDownToClose?: boolean;
}

export function AppBottomSheet({
  visible,
  onClose,
  snapPoints = ['25%', '50%', '90%'],
  title,
  children,
  enablePanDownToClose = true,
}: AppBottomSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPointsMemo = useMemo(() => snapPoints, [snapPoints]);

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        onPress={onClose}
      />
    ),
    [onClose]
  );

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  if (!visible) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPointsMemo}
      onChange={handleSheetChange}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#fff' }}
    >
      <BottomSheetView>
        {title && (
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
            <Text className="text-lg font-bold">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}
        {children}
      </BottomSheetView>
    </BottomSheet>
  );
}
