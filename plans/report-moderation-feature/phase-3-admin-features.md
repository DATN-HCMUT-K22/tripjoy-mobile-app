# Phase 3: Admin Features (4-5 days)

**Goal:** Build admin dashboard for report moderation with role-based access control

**Prerequisites:** Phase 1 & 2 completed (types, services, hooks, user features available)

---

## Tasks Overview

1. Create admin navigation route
2. Build ReportDashboard component
3. Build ReportListItem component
4. Build ReportFilterBar component
5. Build ReportDetailModal component
6. Implement role-based access control
7. Add pagination and sorting

---

## Task 1: Admin Navigation Route

### File: `app/admin/reports.tsx` (NEW)

Create new screen for admin reports dashboard.

```typescript
import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { ReportDashboard } from "@/components/admin/ReportDashboard";
import { useAppSelector } from "@/store/hooks";
import { Ionicons } from "@expo/vector-icons";

export default function AdminReportsScreen() {
  const user = useAppSelector((state) => state.auth.user);
  
  // Check if user is admin
  const isAdmin = user?.roles?.some((role) => role.name === "ADMIN");

  // Render access denied if not admin
  if (!isAdmin) {
    return (
      <View className="flex-1 bg-white">
        <Stack.Screen
          options={{
            title: "Quản lý báo cáo",
            headerShown: true,
          }}
        />
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="lock-closed-outline" size={64} color="#9CA3AF" />
          <Text className="text-xl font-bold text-gray-800 mt-4">
            Truy cập bị từ chối
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            Bạn không có quyền truy cập trang này.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: "Quản lý báo cáo",
          headerShown: true,
        }}
      />
      <ReportDashboard />
    </View>
  );
}
```

**Acceptance Criteria:**
- Route accessible at `/admin/reports`
- Non-admin users see access denied message
- Admin users see ReportDashboard
- Header shows "Quản lý báo cáo"

---

## Task 2: ReportDashboard Component

### File: `components/admin/ReportDashboard.tsx` (NEW)

Main dashboard component with list, filters, and pagination.

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useReportsList } from "@/hooks/useReports";
import { ReportStatus } from "@/types/report";
import { ReportListItem } from "./ReportListItem";
import { ReportFilterBar } from "./ReportFilterBar";
import { ReportDetailModal } from "./ReportDetailModal";

export function ReportDashboard() {
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "ALL">("ALL");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch reports with current filters
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useReportsList({
    page,
    size: pageSize,
    sort: "createdAt,desc",
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const reports = data?.content || [];
  const totalPages = data?.totalPages || 0;
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;

  // Handle report item click
  const handleReportClick = (reportId: string) => {
    setSelectedReportId(reportId);
  };

  // Close detail modal
  const handleCloseDetail = () => {
    setSelectedReportId(null);
  };

  // Pagination handlers
  const handleNextPage = () => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      setPage(page - 1);
    }
  };

  // Reset page when filter changes
  const handleFilterChange = (newFilter: ReportStatus | "ALL") => {
    setStatusFilter(newFilter);
    setPage(0);
  };

  // Render loading state
  if (isLoading && !isFetching) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#34B27D" />
        <Text className="text-gray-600 mt-4">Đang tải báo cáo...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-xl font-bold text-gray-800 mt-4">
          Không thể tải báo cáo
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          {error.message}
        </Text>
        <TouchableOpacity
          onPress={() => refetch()}
          className="mt-4 px-6 py-3 bg-green-600 rounded-lg"
        >
          <Text className="text-white font-semibold">Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Filter Bar */}
      <ReportFilterBar
        selectedFilter={statusFilter}
        onFilterChange={handleFilterChange}
      />

      {/* Report List */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportListItem
            report={item}
            onPress={() => handleReportClick(item.id)}
          />
        )}
        contentContainerClassName="px-4 py-2"
        ItemSeparatorComponent={() => <View className="h-2" />}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <Ionicons name="document-outline" size={64} color="#9CA3AF" />
            <Text className="text-gray-600 mt-4 text-center">
              {statusFilter === "ALL"
                ? "Chưa có báo cáo nào"
                : `Không có báo cáo ${
                    statusFilter === ReportStatus.PENDING
                      ? "đang chờ"
                      : statusFilter === ReportStatus.PROCESSED
                      ? "đã xử lý"
                      : "đã từ chối"
                  }`}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor="#34B27D"
          />
        }
        ListFooterComponent={
          reports.length > 0 ? (
            <View className="pb-4">
              {/* Pagination Controls */}
              <View className="flex-row items-center justify-between px-4 py-4 bg-white rounded-lg mt-2">
                <TouchableOpacity
                  onPress={handlePrevPage}
                  disabled={!hasPrevPage}
                  className={`flex-row items-center px-4 py-2 rounded-lg ${
                    hasPrevPage ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={hasPrevPage ? "#34B27D" : "#9CA3AF"}
                  />
                  <Text
                    className={`ml-1 font-semibold ${
                      hasPrevPage ? "text-green-700" : "text-gray-400"
                    }`}
                  >
                    Trước
                  </Text>
                </TouchableOpacity>

                <Text className="text-gray-600 font-medium">
                  Trang {page + 1} / {totalPages}
                </Text>

                <TouchableOpacity
                  onPress={handleNextPage}
                  disabled={!hasNextPage}
                  className={`flex-row items-center px-4 py-2 rounded-lg ${
                    hasNextPage ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`mr-1 font-semibold ${
                      hasNextPage ? "text-green-700" : "text-gray-400"
                    }`}
                  >
                    Sau
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={hasNextPage ? "#34B27D" : "#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>

              {/* Stats */}
              <Text className="text-center text-gray-500 text-sm mt-2">
                Hiển thị {reports.length} báo cáo ({data?.totalElements || 0} tổng)
              </Text>
            </View>
          ) : null
        }
      />

      {/* Detail Modal */}
      {selectedReportId && (
        <ReportDetailModal
          visible={!!selectedReportId}
          reportId={selectedReportId}
          onClose={handleCloseDetail}
        />
      )}
    </View>
  );
}
```

**Key Features:**
- Paginated list with FlatList
- Filter by status (ALL/PENDING/PROCESSED/DISMISSED)
- Pull-to-refresh
- Click report to view details
- Pagination controls (prev/next)
- Empty states
- Error handling with retry
- Loading states

**Acceptance Criteria:**
- List renders reports correctly
- Pagination works (next/prev buttons)
- Filters work and reset page to 0
- Pull-to-refresh fetches new data
- Clicking report opens detail modal
- Empty state shows when no reports
- Error state shows with retry button

---

## Task 3: ReportListItem Component

### File: `components/admin/ReportListItem.tsx` (NEW)

Individual report card in the list.

```typescript
import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ReportResponse } from "@/types/report";
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  ReportStatus,
} from "@/types/report";
import { timeAgo } from "@/utils/format";

interface ReportListItemProps {
  report: ReportResponse;
  onPress: () => void;
}

export function ReportListItem({ report, onPress }: ReportListItemProps) {
  // Status badge color
  const statusColor =
    report.status === ReportStatus.PENDING
      ? "bg-yellow-100 text-yellow-700"
      : report.status === ReportStatus.PROCESSED
      ? "bg-green-100 text-green-700"
      : "bg-gray-100 text-gray-700";

  // Report type icon
  const reportIcon =
    report.reason === "SPAM"
      ? "megaphone-outline"
      : report.reason === "HARASSMENT"
      ? "warning-outline"
      : report.reason === "VIOLENCE"
      ? "alert-circle-outline"
      : "flag-outline";

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-lg p-4 border border-gray-200"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        {/* Icon */}
        <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-3">
          <Ionicons name={reportIcon as any} size={20} color="#EF4444" />
        </View>

        {/* Content */}
        <View className="flex-1">
          {/* Title */}
          <Text className="text-base font-semibold text-gray-800 mb-1">
            {REPORT_TYPE_LABELS[report.reason]} - {CONTENT_TYPE_LABELS[report.reportedEntityType]}
          </Text>

          {/* Reporter Info */}
          <Text className="text-sm text-gray-600 mb-2">
            Người báo cáo: <Text className="font-medium">@{report.reportedBy}</Text>
          </Text>

          {/* Description Preview */}
          {report.description && (
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              "{report.description}"
            </Text>
          )}

          {/* Footer */}
          <View className="flex-row items-center justify-between mt-1">
            {/* Status Badge */}
            <View className={`px-2 py-1 rounded ${statusColor}`}>
              <Text className={`text-xs font-semibold ${statusColor}`}>
                {REPORT_STATUS_LABELS[report.status]}
              </Text>
            </View>

            {/* Time */}
            <Text className="text-xs text-gray-500">
              {report.createdAt ? timeAgo(new Date(report.createdAt)) : "Vừa xong"}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}
```

**Acceptance Criteria:**
- Displays report type and content type
- Shows reporter username
- Shows description preview (2 lines max)
- Status badge with correct color
- Time ago display
- Tappable with visual feedback

---

## Task 4: ReportFilterBar Component

### File: `components/admin/ReportFilterBar.tsx` (NEW)

Filter chips for status filtering.

```typescript
import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ReportStatus } from "@/types/report";

interface ReportFilterBarProps {
  selectedFilter: ReportStatus | "ALL";
  onFilterChange: (filter: ReportStatus | "ALL") => void;
}

const filters: Array<{ value: ReportStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: ReportStatus.PENDING, label: "Đang chờ" },
  { value: ReportStatus.PROCESSED, label: "Đã xử lý" },
  { value: ReportStatus.DISMISSED, label: "Đã từ chối" },
];

export function ReportFilterBar({
  selectedFilter,
  onFilterChange,
}: ReportFilterBarProps) {
  return (
    <View className="bg-white border-b border-gray-200 px-4 py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="flex-row space-x-2"
      >
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter.value;
          return (
            <TouchableOpacity
              key={filter.value}
              onPress={() => onFilterChange(filter.value)}
              className={`px-4 py-2 rounded-full border ${
                isSelected
                  ? "bg-green-600 border-green-600"
                  : "bg-white border-gray-300"
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`font-semibold ${
                  isSelected ? "text-white" : "text-gray-700"
                }`}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
```

**Acceptance Criteria:**
- Horizontal scrollable filter chips
- Selected filter highlighted
- Clicking filter triggers onFilterChange
- Smooth animations

---

## Task 5: ReportDetailModal Component

### File: `components/admin/ReportDetailModal.tsx` (NEW)

Detailed view with handle actions.

```typescript
import React, { useState } from "react";
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useReportDetail, useHandleReport } from "@/hooks/useReports";
import {
  REPORT_TYPE_LABELS,
  REPORT_STATUS_LABELS,
  CONTENT_TYPE_LABELS,
  ReportStatus,
} from "@/types/report";
import { showErrorToast } from "@/utils/toast";
import { timeAgo } from "@/utils/format";

interface ReportDetailModalProps {
  visible: boolean;
  reportId: string;
  onClose: () => void;
}

export function ReportDetailModal({
  visible,
  reportId,
  onClose,
}: ReportDetailModalProps) {
  const [adminNotes, setAdminNotes] = useState("");
  const [showHandleOptions, setShowHandleOptions] = useState(false);

  const { data: report, isLoading, error } = useReportDetail(reportId, visible);
  const { mutate: handleReport, isPending: isHandling } = useHandleReport();

  const handleAction = (status: ReportStatus.PROCESSED | ReportStatus.DISMISSED) => {
    if (adminNotes.length > 500) {
      showErrorToast("Ghi chú không được vượt quá 500 ký tự");
      return;
    }

    handleReport(
      {
        reportId,
        payload: {
          status,
          description: adminNotes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
          setAdminNotes("");
          setShowHandleOptions(false);
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View className="flex-1 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-lg p-8">
            <ActivityIndicator size="large" color="#34B27D" />
            <Text className="text-gray-600 mt-4">Đang tải...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  // Error state
  if (error || !report) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 items-center justify-center">
          <View className="bg-white rounded-lg p-6 mx-4">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-lg font-bold text-gray-800 mt-4">
              Không thể tải báo cáo
            </Text>
            <Text className="text-gray-600 mt-2">
              {error?.message || "Đã xảy ra lỗi"}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="mt-4 px-6 py-3 bg-gray-200 rounded-lg"
            >
              <Text className="text-gray-800 font-semibold text-center">Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const isPending = report.status === ReportStatus.PENDING;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50"
        activeOpacity={1}
        onPress={onClose}
        disabled={isHandling}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity activeOpacity={1}>
            <View className="bg-white rounded-t-3xl max-h-[90%]">
              {/* Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
                <Text className="text-lg font-semibold text-gray-800">
                  Chi tiết báo cáo
                </Text>
                <TouchableOpacity onPress={onClose} disabled={isHandling}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView className="px-6 py-4">
                {/* Report Info */}
                <View className="bg-gray-50 rounded-lg p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Text className="text-sm text-gray-600 flex-1">Loại vi phạm:</Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {REPORT_TYPE_LABELS[report.reason]}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-3">
                    <Text className="text-sm text-gray-600 flex-1">Nội dung:</Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {CONTENT_TYPE_LABELS[report.reportedEntityType]}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-3">
                    <Text className="text-sm text-gray-600 flex-1">Trạng thái:</Text>
                    <View
                      className={`px-2 py-1 rounded ${
                        report.status === ReportStatus.PENDING
                          ? "bg-yellow-100"
                          : report.status === ReportStatus.PROCESSED
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          report.status === ReportStatus.PENDING
                            ? "text-yellow-700"
                            : report.status === ReportStatus.PROCESSED
                            ? "text-green-700"
                            : "text-gray-700"
                        }`}
                      >
                        {REPORT_STATUS_LABELS[report.status]}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600 flex-1">Thời gian:</Text>
                    <Text className="text-sm font-semibold text-gray-800">
                      {report.createdAt ? timeAgo(new Date(report.createdAt)) : "Vừa xong"}
                    </Text>
                  </View>
                </View>

                {/* Reporter Info */}
                <View className="mb-4">
                  <Text className="text-base font-semibold text-gray-800 mb-2">
                    Người báo cáo
                  </Text>
                  <Text className="text-gray-700">@{report.reportedBy}</Text>
                </View>

                {/* Description */}
                {report.description && (
                  <View className="mb-4">
                    <Text className="text-base font-semibold text-gray-800 mb-2">
                      Mô tả chi tiết
                    </Text>
                    <View className="bg-gray-50 rounded-lg p-4">
                      <Text className="text-gray-700">{report.description}</Text>
                    </View>
                  </View>
                )}

                {/* Content ID */}
                <View className="mb-4">
                  <Text className="text-base font-semibold text-gray-800 mb-2">
                    ID nội dung bị báo cáo
                  </Text>
                  <View className="bg-gray-50 rounded-lg p-3">
                    <Text className="text-gray-600 text-xs font-mono">
                      {report.reportedEntityId}
                    </Text>
                  </View>
                </View>

                {/* Admin Notes (only show if pending) */}
                {isPending && (
                  <View className="mb-4">
                    <Text className="text-base font-semibold text-gray-800 mb-2">
                      Ghi chú admin (tùy chọn)
                    </Text>
                    <TextInput
                      className="border border-gray-200 rounded-lg p-3 min-h-[80px] text-gray-800"
                      placeholder="Nhập ghi chú khi xử lý báo cáo này..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      textAlignVertical="top"
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      maxLength={500}
                      editable={!isHandling}
                    />
                    <Text className="text-xs text-gray-500 mt-1 text-right">
                      {adminNotes.length}/500
                    </Text>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons (only for pending reports) */}
              {isPending && (
                <View className="px-6 py-4 border-t border-gray-100">
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      onPress={() => handleAction(ReportStatus.DISMISSED)}
                      disabled={isHandling}
                      className={`flex-1 py-3 rounded-lg border border-gray-300 ${
                        isHandling ? "opacity-50" : ""
                      }`}
                      activeOpacity={0.7}
                    >
                      {isHandling ? (
                        <ActivityIndicator size="small" color="#6B7280" />
                      ) : (
                        <View className="flex-row items-center justify-center">
                          <Ionicons name="close-circle-outline" size={20} color="#6B7280" />
                          <Text className="text-gray-700 font-semibold ml-2">
                            Từ chối
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAction(ReportStatus.PROCESSED)}
                      disabled={isHandling}
                      className={`flex-1 py-3 rounded-lg bg-green-600 ${
                        isHandling ? "opacity-50" : ""
                      }`}
                      activeOpacity={0.7}
                    >
                      {isHandling ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <View className="flex-row items-center justify-center">
                          <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                          <Text className="text-white font-semibold ml-2">
                            Xử lý
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text className="text-xs text-gray-500 text-center mt-3">
                    Xử lý: Đồng ý báo cáo và xóa nội dung vi phạm
                    {"\n"}
                    Từ chối: Báo cáo không hợp lệ, giữ nguyên nội dung
                  </Text>
                </View>
              )}

              {/* Safe area */}
              <View className="h-4" />
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
```

**Key Features:**
- Displays full report details
- Shows reporter information
- Admin notes input field
- Two action buttons: Process and Dismiss
- Only show actions for PENDING reports
- Loading states during handle action
- Optimistic updates via hook

**Acceptance Criteria:**
- Modal displays all report details
- Admin notes field works correctly
- Process button calls handleReport with PROCESSED
- Dismiss button calls handleReport with DISMISSED
- Loading state disables buttons
- Modal closes after successful action
- Cannot handle already-processed reports

---

## Task 6: Role-Based Access Control

### Implement Admin Role Check

**Files to Modify:**

1. **Navigation Guard** (already in `app/admin/reports.tsx`):
```typescript
const user = useAppSelector((state) => state.auth.user);
const isAdmin = user?.roles?.some((role) => role.name === "ADMIN");

if (!isAdmin) {
  return <AccessDeniedScreen />;
}
```

2. **Hide Admin Menu from Non-Admins** (in main app navigation):
```typescript
// In app/(tabs)/_layout.tsx or wherever admin menu is
const user = useAppSelector((state) => state.auth.user);
const isAdmin = user?.roles?.some((role) => role.name === "ADMIN");

// Only show admin tab/link if user is admin
{isAdmin && (
  <Tab.Screen
    name="admin"
    options={{
      title: "Admin",
      tabBarIcon: ({ color }) => <Ionicons name="shield-checkmark" size={24} color={color} />,
    }}
  />
)}
```

**Backend Enforcement:**
- Backend must verify admin role on all `/api/v1/reports` endpoints except POST (submit)
- Backend returns 403 Forbidden if non-admin accesses admin endpoints
- Frontend guards are for UX only, not security

**Acceptance Criteria:**
- Non-admin users cannot see admin navigation
- Non-admin users see access denied if they manually navigate to admin routes
- Backend enforces role checks (verify with API tests)

---

## Task 7: Pagination and Sorting

### Already Implemented in ReportDashboard

**Pagination:**
- [x] Page state with useState
- [x] Next/prev buttons
- [x] Page number display
- [x] Disable buttons at boundaries
- [x] Reset to page 0 on filter change

**Sorting:**
- [x] Default sort: `createdAt,desc` (newest first)
- [ ] Optional: Add sort dropdown for admin preference

**Optional Enhancement - Sort Dropdown:**

```typescript
// In ReportDashboard
const [sortBy, setSortBy] = useState<string>("createdAt,desc");

const sortOptions = [
  { value: "createdAt,desc", label: "Mới nhất" },
  { value: "createdAt,asc", label: "Cũ nhất" },
  { value: "status,asc", label: "Trạng thái" },
];

// Pass sortBy to useReportsList
const { data } = useReportsList({
  page,
  size: pageSize,
  sort: sortBy,
  status: statusFilter === "ALL" ? undefined : statusFilter,
});
```

---

## Testing Checklist

### Manual Testing

- [ ] **Access Control:**
  - Login as admin → see admin dashboard
  - Login as normal user → see access denied
  - Manually navigate to `/admin/reports` as non-admin

- [ ] **Report List:**
  - View list of reports
  - Filter by status (ALL, PENDING, PROCESSED, DISMISSED)
  - Pull to refresh
  - Navigate between pages
  - Click report to view details

- [ ] **Report Details:**
  - View full report information
  - See reporter details
  - Enter admin notes
  - Click "Xử lý" button
  - Click "Từ chối" button
  - Verify optimistic update
  - Verify list refreshes after action

- [ ] **Edge Cases:**
  - Empty list (no reports)
  - Error loading reports
  - Slow network
  - Already-processed report (no action buttons)
  - Very long descriptions

- [ ] **Pagination:**
  - Navigate to last page
  - Navigate back to first page
  - Verify page count accuracy
  - Filter changes reset to page 0

---

## Acceptance Criteria for Phase 3

- [ ] Admin route created with role guard
- [ ] ReportDashboard component fully functional
- [ ] ReportListItem displays correctly
- [ ] ReportFilterBar works
- [ ] ReportDetailModal displays and handles reports
- [ ] Pagination works correctly
- [ ] Role-based access control implemented
- [ ] Non-admins cannot access admin features
- [ ] All components follow existing patterns
- [ ] Manual testing completed
- [ ] Loading/error states handled

---

## Notes

- **Security:** Never trust frontend role checks for security - backend must enforce
- **Performance:** Use FlatList for efficient rendering of long lists
- **UX:** Show loading states during actions, don't leave users wondering
- **Accessibility:** Add proper labels and color contrast
- **Error Handling:** Always provide retry options on errors

---

**Estimated Time:** 4-5 days  
**Dependencies:** Phase 1 & 2 completed  
**Next Phase:** Phase 4 - Polish & Error Handling
