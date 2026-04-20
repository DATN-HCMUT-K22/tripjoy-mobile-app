import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface ConversationAvatarProps {
  uri: string;
  size?: number;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
}

export const ConversationAvatar: React.FC<ConversationAvatarProps> = ({
  uri,
  size = 56,
  isOnline = false,
  showOnlineStatus = true,
}) => {
  const indicatorSize = size * 0.25; // 25% of avatar size
  const indicatorBorderWidth = Math.max(2, size * 0.04); // 4% of size, min 2px

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={{ uri }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
        transition={200}
      />
      {showOnlineStatus && isOnline && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: indicatorSize / 2,
              borderWidth: indicatorBorderWidth,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#E5E7EB',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
  },
});
