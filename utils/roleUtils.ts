/**
 * Role-based permissions and utilities for Group module
 */

import { GroupMember } from '@/types/group';

export type GroupMemberRole = 'LEADER' | 'CO_LEADER' | 'MEMBER';

export interface RolePermissions {
  canDelete: boolean;
  canTransfer: boolean;
  canEditGroup: boolean;
  canManageMembers: boolean;
  canPromoteDemote: boolean;
  canPinMessages: boolean;
}

export const rolePermissions: Record<GroupMemberRole, RolePermissions> = {
  LEADER: {
    canDelete: true,
    canTransfer: true,
    canEditGroup: true,
    canManageMembers: true,
    canPromoteDemote: true,
    canPinMessages: true,
  },
  CO_LEADER: {
    canDelete: false,
    canTransfer: false,
    canEditGroup: true,
    canManageMembers: true,
    canPromoteDemote: true,
    canPinMessages: true,
  },
  MEMBER: {
    canDelete: false,
    canTransfer: false,
    canEditGroup: false,
    canManageMembers: false,
    canPromoteDemote: false,
    canPinMessages: false,
  },
};

export interface RoleBadgeConfig {
  bg: string;
  text: string;
  icon: string;
  label: string;
  color: string; // Hex color
}

export const roleBadgeConfigs: Record<GroupMemberRole, RoleBadgeConfig> = {
  LEADER: {
    bg: 'bg-amber-500',
    text: 'text-white',
    icon: '👑',
    label: 'Leader',
    color: '#F59E0B',
  },
  CO_LEADER: {
    bg: 'bg-blue-500',
    text: 'text-white',
    icon: '🛡️',
    label: 'Co-Leader',
    color: '#3B82F6',
  },
  MEMBER: {
    bg: 'bg-gray-400',
    text: 'text-white',
    icon: '👥',
    label: 'Member',
    color: '#9CA3AF',
  },
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: GroupMemberRole,
  permission: keyof RolePermissions
): boolean {
  return rolePermissions[role][permission];
}

/**
 * Get badge configuration for a role
 */
export function getRoleBadgeConfig(role: GroupMemberRole): RoleBadgeConfig {
  return roleBadgeConfigs[role];
}

/**
 * Sort members by role hierarchy: LEADER > CO_LEADER > MEMBER
 */
export function sortMembersByRole(members: GroupMember[]): GroupMember[] {
  const roleOrder: Record<GroupMemberRole, number> = {
    LEADER: 0,
    CO_LEADER: 1,
    MEMBER: 2,
  };

  return [...members].sort((a, b) => {
    const orderA = roleOrder[a.role] ?? 999;
    const orderB = roleOrder[b.role] ?? 999;
    return orderA - orderB;
  });
}

/**
 * Get current user's role in a group
 */
export function getCurrentUserRole(
  group: { members: GroupMember[] } | undefined,
  currentUserId: string | undefined
): GroupMemberRole | undefined {
  if (!group || !currentUserId) return undefined;

  const member = group.members.find(m => m.user.id === currentUserId);
  return member?.role;
}

/**
 * Check if current user is group leader
 */
export function isGroupLeader(
  group: { members: GroupMember[] } | undefined,
  currentUserId: string | undefined
): boolean {
  const role = getCurrentUserRole(group, currentUserId);
  return role === 'LEADER';
}

/**
 * Check if current user is leader or co-leader
 */
export function isGroupManager(
  group: { members: GroupMember[] } | undefined,
  currentUserId: string | undefined
): boolean {
  const role = getCurrentUserRole(group, currentUserId);
  return role === 'LEADER' || role === 'CO_LEADER';
}
