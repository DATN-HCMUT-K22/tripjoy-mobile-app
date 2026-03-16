import { useGroup, useGroupMembers, useAddGroupMember, useUpdateGroupMemberRole, useRemoveGroupMember, useTransferGroupLeadership, useLeaveGroupFromMembers } from "@/hooks/useGroups";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Role = "LEADER" | "CO_LEADER" | "MEMBER";

export default function GroupMembersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const groupId = params.id;

  const { data: group } = useGroup(groupId);
  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useGroupMembers(groupId);
  const { data: currentUser } = useCurrentUser(!!groupId);

  const addMemberMutation = useAddGroupMember(groupId);
  const updateRoleMutation = useUpdateGroupMemberRole(groupId);
  const removeMemberMutation = useRemoveGroupMember(groupId);
  const transferLeaderMutation = useTransferGroupLeadership(groupId);
  const leaveGroupMutation = useLeaveGroupFromMembers(groupId);

  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<Role>("MEMBER");

  const myMembership = useMemo(() => {
    if (!currentUser) return null;
    return members.find((m) => m.user.id === currentUser.id) ?? null;
  }, [members, currentUser]);

  const myRole = myMembership?.role ?? null;
  const canManageMembers = myRole === "LEADER" || myRole === "CO_LEADER";
  const isLeader = myRole === "LEADER";

  const handleChangeRole = (memberId: string, currentRole: Role) => {
    if (!groupId) return;
    if (!canManageMembers) return;

    // Không cho self-change role từ đây
    if (myMembership && myMembership.id === memberId) {
      return;
    }

    const nextRole: Role =
      currentRole === "MEMBER" ? "CO_LEADER" : currentRole === "CO_LEADER" ? "MEMBER" : "LEADER";

    // Nếu nextRole là LEADER thì bắt buộc confirm chuyển leader
    if (nextRole === "LEADER") {
      if (!isLeader) return; // Chỉ leader mới được chuyển leader
      Alert.alert(
        "Chuyển trưởng nhóm",
        "Bạn có chắc muốn chuyển quyền trưởng nhóm cho thành viên này?",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Đồng ý",
            style: "destructive",
            onPress: () => {
              transferLeaderMutation.mutate({ newLeaderId: memberId });
            },
          },
        ]
      );
      return;
    }

    updateRoleMutation.mutate({ memberId, payload: { role: nextRole } });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!groupId || !canManageMembers) return;
    if (myMembership && myMembership.id === memberId) {
      return;
    }
    Alert.alert(
      "Xóa thành viên",
      "Bạn có chắc muốn xóa thành viên này khỏi nhóm?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => removeMemberMutation.mutate(memberId),
        },
      ]
    );
  };

  const handleAddMember = () => {
    if (!groupId || !canManageMembers) return;
    const trimmed = newMemberId.trim();
    if (!trimmed) return;
    addMemberMutation.mutate(
      {
        member_id: trimmed,
        role: newMemberRole,
      },
      {
        onSuccess: () => {
          setNewMemberId("");
          setNewMemberRole("MEMBER");
        },
      }
    );
  };

  const handleLeaveGroup = () => {
    if (!groupId || !myMembership) return;
    Alert.alert(
      "Rời nhóm",
      "Bạn có chắc chắn muốn rời khỏi nhóm này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Rời nhóm",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveGroupMutation.mutateAsync();
              // Sau khi rời nhóm, quay về màn danh sách nhóm
              router.replace("/groups");
            } catch {
              // Error đã được handle trong hook
            }
          },
        },
      ]
    );
  };

  const renderRoleBadge = (role: Role, isMe: boolean) => {
    let label = "";
    let bg = "";
    let color = "#111827";

    switch (role) {
      case "LEADER":
        label = "Trưởng nhóm";
        bg = "#F97316";
        color = "#FFFFFF";
        break;
      case "CO_LEADER":
        label = "Phó nhóm";
        bg = "#3B82F6";
        color = "#FFFFFF";
        break;
      default:
        label = "Thành viên";
        bg = "#E5E7EB";
        color = "#374151";
        break;
    }

    return (
      <View style={[styles.roleBadge, { backgroundColor: bg }]}>
        <Text style={[styles.roleBadgeText, { color }]}>
          {label}
          {isMe ? " • Bạn" : ""}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thành viên nhóm</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Group summary */}
      <View style={styles.groupSummary}>
        <Text style={styles.groupName} numberOfLines={1}>
          {group?.name ?? "Nhóm"}
        </Text>
        <Text style={styles.groupMeta}>
          {members.length} thành viên
          {myRole && ` • Vai trò của bạn: ${myRole === "LEADER" ? "Trưởng nhóm" : myRole === "CO_LEADER" ? "Phó nhóm" : "Thành viên"}`}
        </Text>
      </View>

      {/* Add member quick section */}
      {canManageMembers && (
        <View style={styles.addSection}>
          <Text style={styles.addLabel}>Thêm thành viên (nhập ID nhanh)</Text>
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="Nhập User ID..."
              placeholderTextColor="#9CA3AF"
              value={newMemberId}
              onChangeText={setNewMemberId}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[
                styles.addRoleButton,
                newMemberRole === "MEMBER" && styles.addRoleButtonActive,
              ]}
              onPress={() => setNewMemberRole("MEMBER")}
            >
              <Text
                style={[
                  styles.addRoleButtonText,
                  newMemberRole === "MEMBER" && styles.addRoleButtonTextActive,
                ]}
              >
                Member
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.addRoleButton,
                newMemberRole === "CO_LEADER" && styles.addRoleButtonActive,
              ]}
              onPress={() => setNewMemberRole("CO_LEADER")}
            >
              <Text
                style={[
                  styles.addRoleButtonText,
                  newMemberRole === "CO_LEADER" && styles.addRoleButtonTextActive,
                ]}
              >
                Co-leader
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.addSubmitButton,
              (!newMemberId.trim() || addMemberMutation.isPending) && styles.addSubmitButtonDisabled,
            ]}
            onPress={handleAddMember}
            activeOpacity={0.8}
            disabled={!newMemberId.trim() || addMemberMutation.isPending}
          >
            {addMemberMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addSubmitText}>Thêm thành viên</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Members list */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {isLoading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#16A34A" />
            <Text style={styles.loadingText}>Đang tải danh sách thành viên...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerWrap}>
            <Ionicons name="alert-circle" size={36} color="#EF4444" />
            <Text style={styles.errorText}>Không tải được danh sách thành viên</Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={styles.retryButton}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : members.length === 0 ? (
          <View style={styles.centerWrap}>
            <Ionicons name="people-outline" size={40} color="#9CA3AF" />
            <Text style={styles.emptyText}>Nhóm chưa có thành viên</Text>
          </View>
        ) : (
          members.map((m) => {
            const isMe = !!currentUser && m.user.id === currentUser.id;
            const canManageThis =
              canManageMembers &&
              !isMe &&
              // Không cho thao tác với leader khác nếu mình không phải leader
              !(m.role === "LEADER" && !isLeader);

            const name = m.user.fullName || m.user.username || "Thành viên";

            return (
              <View key={m.id} style={styles.memberItem}>
                {m.user.avatarUrl ? (
                  <Image
                    source={{ uri: m.user.avatarUrl }}
                    style={styles.memberAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <Text style={styles.memberAvatarInitial}>
                      {name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.memberUsername} numberOfLines={1}>
                    @{m.user.username}
                  </Text>
                  {renderRoleBadge(m.role, isMe)}
                </View>
                {canManageThis && (
                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      style={styles.memberActionButton}
                      onPress={() => handleChangeRole(m.id, m.role)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="swap-vertical" size={18} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.memberActionButton, styles.memberActionDanger]}
                      onPress={() => handleRemoveMember(m.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Leave group */}
      {myMembership && (
        <View style={styles.leaveWrap}>
          <TouchableOpacity
            style={styles.leaveButton}
            onPress={handleLeaveGroup}
            activeOpacity={0.8}
            disabled={leaveGroupMutation.isPending}
          >
            {leaveGroupMutation.isPending ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <>
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                <Text style={styles.leaveText}>Rời nhóm</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  headerBack: {
    width: 40,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  headerRight: {
    width: 40,
  },
  groupSummary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  groupName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  groupMeta: {
    fontSize: 13,
    color: "#6B7280",
  },
  addSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  addLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginRight: 8,
    color: "#111827",
  },
  addRoleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    marginLeft: 4,
  },
  addRoleButtonActive: {
    backgroundColor: "#DCFCE7",
    borderColor: "#16A34A",
  },
  addRoleButtonText: {
    fontSize: 12,
    color: "#4B5563",
  },
  addRoleButtonTextActive: {
    color: "#166534",
    fontWeight: "600",
  },
  addSubmitButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    backgroundColor: "#16A34A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addSubmitButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  addSubmitText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 80,
  },
  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: "#DC2626",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#16A34A",
  },
  retryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  memberAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarInitial: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B5563",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  memberUsername: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  memberActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  memberActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    backgroundColor: "#FFFFFF",
  },
  memberActionDanger: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  leaveWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
    gap: 6,
  },
  leaveText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
});


