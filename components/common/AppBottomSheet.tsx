import { View, Text, TouchableOpacity } from 'react-native';
import { 
  BottomSheetBackdrop, 
  BottomSheetScrollView, 
  BottomSheetModal 
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useRef, useEffect } from 'react';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
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
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const snapPointsMemo = useMemo(() => snapPoints, [snapPoints]);

  useEffect(() => {
    if (visible) {
      bottomSheetModalRef.current?.present();
    } else {
      bottomSheetModalRef.current?.dismiss();
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

  return (
    <BottomSheetModal
      ref={bottomSheetModalRef}
      index={0}
      snapPoints={snapPointsMemo}
      onChange={handleSheetChange}
      enablePanDownToClose={enablePanDownToClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#fff' }}
      onDismiss={onClose}
    >
      {title && (
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-bold">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      )}
      <BottomSheetScrollView>
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
