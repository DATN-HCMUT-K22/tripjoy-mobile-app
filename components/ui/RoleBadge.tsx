/**
 * RoleBadge Component
 * Displays role indicator with color-coded badge
 */

import { View, Text } from 'react-native';
import { getRoleBadgeConfig, GroupMemberRole } from '@/utils/roleUtils';

interface RoleBadgeProps {
  role: GroupMemberRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showLabel?: boolean;
}

export function RoleBadge({
  role,
  size = 'md',
  showIcon = true,
  showLabel = true
}: RoleBadgeProps) {
  const config = getRoleBadgeConfig(role);

  const sizeClasses = {
    sm: 'px-2 py-0.5',
    md: 'px-3 py-1',
    lg: 'px-4 py-1.5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <View
      className={`flex-row items-center rounded-full ${config.bg} ${sizeClasses[size]}`}
    >
      <Text className={`${config.text} ${textSizes[size]} font-medium`}>
        {showIcon && config.icon}
        {showIcon && showLabel && ' '}
        {showLabel && config.label}
      </Text>
    </View>
  );
}
