import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon = 'documents-outline', title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color="#D1D5DB" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.button}
          onPress={onAction}
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// Preset empty states
export function NoItinerariesEmpty({ onCreateNew }: { onCreateNew?: () => void }) {
  return (
    <EmptyState
      icon="map-outline"
      title="Chưa có lịch trình nào"
      message="Tạo lịch trình đầu tiên của bạn để bắt đầu hành trình"
      actionLabel="Tạo lịch trình mới"
      onAction={onCreateNew}
    />
  );
}

export function NoTripItemsEmpty({ onAddItem }: { onAddItem?: () => void }) {
  return (
    <EmptyState
      icon="location-outline"
      title="Chưa có hoạt động nào"
      message="Thêm địa điểm và hoạt động vào lịch trình của bạn"
      actionLabel="Thêm hoạt động"
      onAction={onAddItem}
    />
  );
}

export function NoExpensesEmpty({ onAddExpense }: { onAddExpense?: () => void }) {
  return (
    <EmptyState
      icon="wallet-outline"
      title="Chưa có chi phí nào"
      message="Ghi chép chi phí để quản lý ngân sách tốt hơn"
      actionLabel="Thêm chi phí"
      onAction={onAddExpense}
    />
  );
}

export function NoSearchResultsEmpty() {
  return (
    <EmptyState
      icon="search-outline"
      title="Không tìm thấy kết quả"
      message="Thử tìm kiếm với từ khóa khác"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
    minHeight: 300,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2BB673',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
