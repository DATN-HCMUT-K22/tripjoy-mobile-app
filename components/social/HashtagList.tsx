import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

interface HashtagListProps {
  hashtags: string[];
  onHashtagPress?: (hashtag: string) => void;
}

export const HashtagList: React.FC<HashtagListProps> = ({
  hashtags,
  onHashtagPress,
}) => {
  const router = useRouter();

  if (!hashtags || hashtags.length === 0) return null;

  const handlePress = (tag: string) => {
    // Call custom handler if provided
    onHashtagPress?.(tag);

    // Navigate to explore screen with hashtag filter
    router.push(`/(tabs)/explore?hashtag=${tag}` as any);
  };

  return (
    <View style={styles.container}>
      {hashtags.map((tag, index) => (
        <TouchableOpacity
          key={`${tag}-${index}`}
          style={styles.chip}
          onPress={() => handlePress(tag)}
          activeOpacity={0.7}
        >
          <Text style={styles.chipText}>#{tag}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  chip: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipText: {
    color: '#0369A1',
    fontSize: 13,
    fontWeight: '600',
  },
});
