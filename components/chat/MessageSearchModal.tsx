/**
 * MessageSearchModal Component
 * Search messages in conversation with highlighting
 */

import { Modal, View, Text, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import { Image as ExpoImage } from 'expo-image';
import { useDebounce } from '@/hooks/useDebounce';

interface Message {
  id: string;
  message_content: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  created_at: string;
}

interface MessageSearchModalProps {
  visible: boolean;
  onClose: () => void;
  messages: Message[];
  onMessagePress: (messageId: string) => void;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString('vi-VN');
}

function MessageSearchResult({ message, query, onPress }: any) {
  const highlightedText = useMemo(() => {
    const regex = new RegExp(`(${query})`, 'gi');
    return message.message_content.split(regex);
  }, [message.message_content, query]);

  return (
    <TouchableOpacity
      className="px-4 py-3 border-b border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center mb-2">
        {message.sender.avatarUrl ? (
          <ExpoImage
            source={{ uri: message.sender.avatarUrl }}
            style={{ width: 32, height: 32, borderRadius: 16 }}
          />
        ) : (
          <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
            <Text className="text-primary text-xs font-semibold">
              {message.sender.fullName.charAt(0)}
            </Text>
          </View>
        )}
        <View className="ml-2">
          <Text className="font-semibold text-sm">{message.sender.fullName}</Text>
          <Text className="text-xs text-gray-500">
            {formatRelativeTime(message.created_at)}
          </Text>
        </View>
      </View>
      <Text className="text-gray-800" numberOfLines={2}>
        {highlightedText.map((part, index) => (
          <Text
            key={index}
            className={part.toLowerCase() === query.toLowerCase() ? 'bg-yellow-200' : ''}
          >
            {part}
          </Text>
        ))}
      </Text>
    </TouchableOpacity>
  );
}

export function MessageSearchModal({
  visible,
  onClose,
  messages,
  onMessagePress,
}: MessageSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const searchResults = useMemo(() => {
    if (debouncedQuery.length < 3) return [];
    const query = debouncedQuery.toLowerCase();
    return messages.filter(m =>
      m.message_content.toLowerCase().includes(query)
    );
  }, [messages, debouncedQuery]);

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView className="flex-1 bg-white">
        {/* Search Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <TextInput
            className="flex-1 ml-3 text-base"
            placeholder="Tìm tin nhắn..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Results */}
        {debouncedQuery.length < 3 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4">Nhập ít nhất 3 ký tự để tìm kiếm</Text>
          </View>
        ) : searchResults.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="search-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4">Không tìm thấy tin nhắn nào</Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={({ item }) => (
              <MessageSearchResult
                message={item}
                query={debouncedQuery}
                onPress={() => {
                  onClose();
                  onMessagePress(item.id);
                }}
              />
            )}
            keyExtractor={(item) => item.id}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
