import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ErrorFallbackProps = {
  error: Error;
  reset: () => void;
};

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  const isNetworkError = error.message.includes('network') || error.message.includes('fetch');

  return (
    <View style={styles.container}>
      <Ionicons
        name={isNetworkError ? 'cloud-offline-outline' : 'alert-circle-outline'}
        size={64}
        color="#EF4444"
      />
      <Text style={styles.title}>
        {isNetworkError ? 'Lỗi kết nối' : 'Đã xảy ra lỗi'}
      </Text>
      <Text style={styles.message}>
        {isNetworkError
          ? 'Vui lòng kiểm tra kết nối mạng và thử lại'
          : 'Đã xảy ra lỗi không mong muốn'}
      </Text>
      {__DEV__ && (
        <Text style={styles.errorDetails}>{error.message}</Text>
      )}
      <TouchableOpacity
        style={styles.button}
        onPress={reset}
        accessibilityLabel="Thử lại"
        accessibilityRole="button"
      >
        <Ionicons name="reload" size={20} color="#FFFFFF" />
        <Text style={styles.buttonText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorDetails: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2BB673',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
