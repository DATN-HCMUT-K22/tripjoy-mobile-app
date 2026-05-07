import React from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Image,
} from 'react-native';
import { resolveUserAvatarUri } from '@/utils/userAvatar';
import { Ionicons } from '@expo/vector-icons';

export interface MentionUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string | null;
  isBot?: boolean;
}

interface MentionSuggestionsProps {
  suggestions: MentionUser[];
  onSelect: (user: MentionUser) => void;
  isDark?: boolean;
}

export const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  suggestions,
  onSelect,
  isDark = false,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderTopColor: isDark ? '#374151' : '#E5E7EB',
        },
      ]}
    >
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onSelect(item)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarContainer}>
              {item.isBot ? (
                <View style={styles.botIconContainer}>
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </View>
              ) : (
                <Image
                  source={{ uri: resolveUserAvatarUri(item.avatarUrl, item.fullName) }}
                  style={styles.avatar}
                />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.fullName,
                  { color: isDark ? '#F9FAFB' : '#111827' },
                ]}
              >
                {item.fullName}
              </Text>
              <Text style={styles.username}>@{item.username}</Text>
            </View>
            {item.isBot && (
              <View style={styles.botBadge}>
                <Text style={styles.botBadgeText}>AI BOT</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        keyboardShouldPersistTaps="always"
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxHeight: 200,
    width: '100%',
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  list: {
    paddingVertical: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  botIconContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  fullName: {
    fontSize: 14,
    fontWeight: '600',
  },
  username: {
    fontSize: 12,
    color: '#6B7280',
  },
  botBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  botBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
});
