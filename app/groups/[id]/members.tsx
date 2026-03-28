import { useGroup, useGroupMembers, useAddGroupMember, useUpdateGroupMemberRole, useRemoveGroupMember, useTransferGroupLeadership, useLeaveGroupFromMembers } from "@/hooks/useGroups";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { searchService } from "@/services/search";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { GroupMember } from "@/types/group";
import { UserSimpleResponse } from "@/types/search";

type Role = "LEADER" | "CO_LEADER" | "MEMBER";

const roleSortOrder = (role: Role) =>
  role === "LEADER" ? 0 : role === "CO_LEADER" ? 1 : 2;

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

  const [memberSearch, setMemberSearch] = useState("");
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userResults, setUserResults] = useState<UserSimpleResponse[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSimpleResponse | null>(null);
  const [activeMemberActionId, setActiveMemberActionId] = useState<string | null>(null);
  const [confirmRemoveMemberId, setConfirmRemoveMemberId] = useState<string | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);

  const myMembership = useMemo(() => {
    if (!currentUser) return null;
    return members.find((m) => m.user.id === currentUser.id) ?? null;
  }, [members, currentUser]);

  /** Luôn hiển thị Trưởng nhóm đầu tiên, sau đó Phó nhóm, rồi Thành viên */
  const sortedMembers = useMemo(() => {
    return [...members].sort((a: GroupMember, b: GroupMember) => {
      const d = roleSortOrder(a.role) - roleSortOrder(b.role);
      if (d !== 0) return d;
      const na = (a.user.fullName || a.user.username || "").toLowerCase();
      const nb = (b.user.fullName || b.user.username || "").toLowerCase();
      return na.localeCompare(nb, "vi");
    });
  }, [members]);

  const myRole = myMembership?.role ?? null;
  const canManageMembers = myRole === "LEADER" || myRole === "CO_LEADER";
  const isLeader = myRole === "LEADER";
  const hasOtherMember = members.some((m) => m.user.id !== currentUser?.id);

  const getRoleLabel = (role: Role) => {
    if (role === "LEADER") return "Trưởng nhóm";
    if (role === "CO_LEADER") return "Phó nhóm";
    return "Thành viên";
  };

  useEffect(() => {
    const keyword = memberSearch.trim();
    if (!canManageMembers || !keyword) {
      setUserResults([]);
      setIsSearchingUsers(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        searchAbortRef.current?.abort();
        const controller = new AbortController();
        searchAbortRef.current = controller;
        setIsSearchingUsers(true);
        const res = await searchService.searchUsers(keyword, controller.signal);
        if (res.code === 1000 || res.code === 0) {
          const existingIds = new Set(members.map((m) => m.user.id));
          setUserResults((res.data || []).filter((u) => !existingIds.has(u.id)));
        } else {
          setUserResults([]);
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setUserResults([]);
        }
      } finally {
        setIsSearchingUsers(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [memberSearch, canManageMembers, members]);

  const handleTransferLeader = (memberId: string) => {
    transferLeaderMutation.mutate({ newLeaderId: memberId });
  };

  const handleUpdateRole = (memberId: string, role: Role) => {
    updateRoleMutation.mutate({ memberId, payload: { role } });
  };

  const handleMemberActions = (memberId: string, currentRole: Role, name: string) => {
    if (!canManageMembers) return;
    const actions: { text: string; onPress?: () => void; style?: "destructive" | "cancel" | "default" }[] = [];

    // Leader có thể chuyển quyền cho MEMBER/CO_LEADER
    if (isLeader && currentRole !== "LEADER") {
      actions.push({
        text: "Chuyển quyền Trưởng nhóm",
        onPress: () => handleTransferLeader(memberId),
      });
    }

    if (currentRole === "MEMBER") {
      actions.push({
        text: "Đổi thành Phó nhóm",
        onPress: () => handleUpdateRole(memberId, "CO_LEADER"),
      });
    }
    if (currentRole === "CO_LEADER") {
      actions.push({
        text: "Hạ về Thành viên",
        onPress: () => handleUpdateRole(memberId, "MEMBER"),
      });
    }

    actions.push({
      text: "Xóa khỏi nhóm",
      style: "destructive",
      onPress: () => handleRemoveMember(memberId),
    });
    actions.push({ text: "Hủy", style: "cancel" });

    Alert.alert(name, `Vai trò hiện tại: ${getRoleLabel(currentRole)}`, actions);
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

  const handleAddMember = (role: Role = "MEMBER") => {
    if (!groupId || !canManageMembers) return;
    if (!selectedUser?.id) return;
    addMemberMutation.mutate(
      {
        member_id: selectedUser.id,
        role,
      },
      {
        onSuccess: () => {
          setMemberSearch("");
          setUserResults([]);
          setSelectedUser(null);
        },
      }
    );
  };

  const handleLeaveGroup = () => {
    if (!groupId || !myMembership) return;
    if (myRole === "LEADER" && hasOtherMember) {
      Alert.alert(
        "Không thể rời nhóm ngay",
        "Bạn đang là Trưởng nhóm. Hãy chuyển quyền trưởng nhóm cho thành viên khác trước khi rời nhóm."
      );
      return;
    }
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

      {/* Mời thành viên — mặc định vai trò Thành viên */}
      {canManageMembers && (
        <View style={styles.addSection}>
          <View style={styles.addCard}>
            <View style={styles.addCardTitleRow}>
              <View style={styles.addCardIconWrap}>
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.addCardTitleTextCol}>
                <Text style={styles.addCardTitle}>Mời thêm thành viên</Text>
                <Text style={styles.addCardSubtitle}>Tìm theo username hoặc email</Text>
              </View>
            </View>

            <View style={styles.searchPill}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchPillInput}
                placeholder="Tìm người để mời..."
                placeholderTextColor="#9CA3AF"
                value={memberSearch}
                onChangeText={(text) => {
                  setMemberSearch(text);
                  setSelectedUser(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {memberSearch.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setMemberSearch("");
                    setUserResults([]);
                    setSelectedUser(null);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={22} color="#D1D5DB" />
                </TouchableOpacity>
              )}
            </View>

            {isSearchingUsers ? (
              <View style={styles.searchLoadingWrap}>
                <ActivityIndicator size="small" color="#16A34A" />
                <Text style={styles.searchLoadingText}>Đang tìm...</Text>
              </View>
            ) : userResults.length > 0 ? (
              <View style={styles.searchResultsCard}>
                <Text style={styles.searchResultsLabel}>Gợi ý</Text>
                {userResults.slice(0, 6).map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.searchResultRow}
                    onPress={() => {
                      setSelectedUser(u);
                      setMemberSearch(u.username || u.fullName || "");
                      setUserResults([]);
                    }}
                    activeOpacity={0.7}
                  >
                    {u.avatarUrl ? (
                      <Image
                        source={{ uri: u.avatarUrl }}
                        style={styles.searchResultAvatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.searchResultAvatarPh}>
                        <Text style={styles.searchResultAvatarLetter}>
                          {(u.fullName || u.username || "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.searchResultTextCol}>
                      <Text style={styles.searchResultName} numberOfLines={1}>
                        {u.fullName || u.username}
                      </Text>
                      <Text style={styles.searchResultMeta} numberOfLines={1}>
                        @{u.username}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            {selectedUser && (
              <View style={styles.selectedUserCard}>
                <View style={styles.selectedUserRow}>
                  {selectedUser.avatarUrl ? (
                    <Image
                      source={{ uri: selectedUser.avatarUrl }}
                      style={styles.selectedUserAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.selectedUserAvatarPh}>
                      <Text style={styles.selectedUserAvatarLetter}>
                        {(selectedUser.fullName || selectedUser.username || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.selectedUserInfo}>
                    <Text style={styles.selectedUserName} numberOfLines={1}>
                      {selectedUser.fullName || selectedUser.username}
                    </Text>
                    <Text style={styles.selectedUserMeta} numberOfLines={1}>
                      @{selectedUser.username}
                    </Text>
                    <View style={styles.roleHintBadge}>
                      <Ionicons name="person-outline" size={12} color="#166534" />
                      <Text style={styles.roleHintBadgeText}>Vai trò: Thành viên</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedUser(null);
                      setMemberSearch("");
                    }}
                    style={styles.selectedUserClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={22} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.addPrimaryBtn,
                    (!selectedUser?.id || addMemberMutation.isPending) && styles.addPrimaryBtnDisabled,
                  ]}
                  onPress={() => handleAddMember("MEMBER")}
                  activeOpacity={0.85}
                  disabled={!selectedUser?.id || addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                      <Text style={styles.addPrimaryBtnText}>Thêm vào nhóm</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.addSecondaryBtn,
                    (!selectedUser?.id || addMemberMutation.isPending) && styles.addSecondaryBtnDisabled,
                  ]}
                  onPress={() => handleAddMember("CO_LEADER")}
                  activeOpacity={0.8}
                  disabled={!selectedUser?.id || addMemberMutation.isPending}
                >
                  <Ionicons name="shield-outline" size={18} color="#2563EB" />
                  <Text style={styles.addSecondaryBtnText}>Thêm làm Phó nhóm</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
          sortedMembers.map((m) => {
            const isMe = !!currentUser && m.user.id === currentUser.id;
            const canManageThis =
              canManageMembers &&
              !isMe &&
              // Không cho thao tác với leader khác nếu mình không phải leader
              !(m.role === "LEADER" && !isLeader);

            const name = m.user.fullName || m.user.username || "Thành viên";

            return (
              <React.Fragment key={m.id}>
              <View style={styles.memberItem}>
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
                      onPress={() =>
                        setActiveMemberActionId((prev) => (prev === m.id ? null : m.id))
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons name="ellipsis-horizontal" size={18} color="#2563EB" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {activeMemberActionId === m.id && canManageThis && (
                <View style={styles.memberActionPanel}>
                  {isLeader && m.role !== "LEADER" && (
                    <TouchableOpacity
                      style={styles.memberActionPanelBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setActiveMemberActionId(null);
                        handleTransferLeader(m.id);
                      }}
                    >
                      <Ionicons name="shield-checkmark-outline" size={16} color="#EA580C" />
                      <Text style={[styles.memberActionPanelText, { color: "#EA580C" }]}>
                        Chuyển quyền trưởng nhóm
                      </Text>
                    </TouchableOpacity>
                  )}
                  {m.role === "MEMBER" && (
                    <TouchableOpacity
                      style={styles.memberActionPanelBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setActiveMemberActionId(null);
                        handleUpdateRole(m.id, "CO_LEADER");
                      }}
                    >
                      <Ionicons name="arrow-up-circle-outline" size={16} color="#2563EB" />
                      <Text style={styles.memberActionPanelText}>Đổi thành phó nhóm</Text>
                    </TouchableOpacity>
                  )}
                  {m.role === "CO_LEADER" && (
                    <TouchableOpacity
                      style={styles.memberActionPanelBtn}
                      activeOpacity={0.7}
                      onPress={() => {
                        setActiveMemberActionId(null);
                        handleUpdateRole(m.id, "MEMBER");
                      }}
                    >
                      <Ionicons name="arrow-down-circle-outline" size={16} color="#4B5563" />
                      <Text style={styles.memberActionPanelText}>Hạ về thành viên</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.memberActionPanelBtn}
                    activeOpacity={0.7}
                    onPress={() => setConfirmRemoveMemberId(m.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    <Text style={[styles.memberActionPanelText, { color: "#EF4444" }]}>
                      Xóa khỏi nhóm
                    </Text>
                  </TouchableOpacity>
                  {confirmRemoveMemberId === m.id && (
                    <View style={styles.confirmRemoveWrap}>
                      <Text style={styles.confirmRemoveText}>Xác nhận xóa thành viên này?</Text>
                      <View style={styles.confirmRemoveActions}>
                        <TouchableOpacity
                          style={styles.confirmCancelBtn}
                          onPress={() => setConfirmRemoveMemberId(null)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.confirmCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.confirmDeleteBtn}
                          onPress={() => {
                            setConfirmRemoveMemberId(null);
                            setActiveMemberActionId(null);
                            handleRemoveMember(m.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.confirmDeleteText}>Xóa</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
              </React.Fragment>
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
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: "#F3F4F6",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  addCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  addCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  addCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addCardTitleTextCol: {
    flex: 1,
  },
  addCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.2,
  },
  addCardSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 18,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 4,
    minHeight: 48,
  },
  searchPillInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#111827",
    paddingVertical: 10,
  },
  searchLoadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingVertical: 4,
  },
  searchLoadingText: {
    fontSize: 13,
    color: "#6B7280",
  },
  searchResultsCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    overflow: "hidden",
  },
  searchResultsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchResultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F3F4F6",
  },
  searchResultAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  searchResultAvatarPh: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  searchResultAvatarLetter: {
    fontSize: 16,
    fontWeight: "700",
    color: "#166534",
  },
  searchResultTextCol: {
    flex: 1,
    minWidth: 0,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  searchResultMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  selectedUserCard: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  selectedUserRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  selectedUserAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  selectedUserAvatarPh: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedUserAvatarLetter: {
    fontSize: 18,
    fontWeight: "700",
    color: "#166534",
  },
  selectedUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  selectedUserName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  selectedUserMeta: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  roleHintBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#ECFDF5",
  },
  roleHintBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#166534",
  },
  selectedUserClear: {
    padding: 4,
  },
  addPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 14,
  },
  addPrimaryBtnDisabled: {
    backgroundColor: "#9CA3AF",
  },
  addPrimaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  addSecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFC",
  },
  addSecondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  addSecondaryBtnDisabled: {
    opacity: 0.45,
    borderColor: "#E5E7EB",
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
  memberActionPanel: {
    marginTop: 8,
    marginLeft: 56,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  memberActionPanelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  memberActionPanelText: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "600",
  },
  confirmRemoveWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FEF2F2",
  },
  confirmRemoveText: {
    fontSize: 12,
    color: "#991B1B",
    marginBottom: 8,
    fontWeight: "600",
  },
  confirmRemoveActions: {
    flexDirection: "row",
    gap: 8,
  },
  confirmCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  confirmCancelText: {
    fontSize: 12,
    color: "#4B5563",
    fontWeight: "600",
  },
  confirmDeleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#DC2626",
  },
  confirmDeleteText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "700",
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


