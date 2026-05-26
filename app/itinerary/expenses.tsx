import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useExpenses, useAddExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { useItineraryDetail, useItineraryTripItems } from "@/hooks/useItineraries";
import { ExpenseRequest, ExpenseResponse } from "@/services/itineraries";
import { SharedHeader } from "@/components/common/SharedHeader";
import { AppDialogModal } from "@/components/common/AppDialogModal";
import { TripItemPicker } from "@/components/expense/TripItemPicker";
import { MemberPicker, type MemberOption } from "@/components/expense/MemberPicker";
import { ReceiptImagePicker } from "@/components/expense/ReceiptImagePicker";
import { useAppSelector } from "@/store/hooks";
import { useGroup } from "@/hooks/useGroups";

const EXPENSE_CATEGORIES = [
  { id: "FOOD", name: "Ăn uống", icon: "restaurant-outline", color: "#F59E0B", bg: "bg-amber-100" },
  { id: "TRANSPORT", name: "Di chuyển", icon: "car-outline", color: "#3B82F6", bg: "bg-blue-100" },
  { id: "ACCOMMODATION", name: "Chỗ ở", icon: "bed-outline", color: "#8B5CF6", bg: "bg-purple-100" },
  { id: "ACTIVITY", name: "Hoạt động", icon: "ticket-outline", color: "#EC4899", bg: "bg-pink-100" },
  { id: "OTHER", name: "Khác", icon: "shapes-outline", color: "#6B7280", bg: "bg-gray-100" },
];

function getCategoryData(type?: string) {
  const norm = (type || "").toUpperCase();
  const found = EXPENSE_CATEGORIES.find((c) => c.id === norm);
  return found || EXPENSE_CATEGORIES[4];
}

function formatDateTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${hours}:${minutes}, ${day}/${month}/${year}`;
}

export default function ExpensesScreen() {
  // const router = useRouter();
  const insets = useSafeAreaInsets();
  const { itineraryId: rawId } = useLocalSearchParams<{ itineraryId?: string }>();
  const itineraryId = typeof rawId === "string" ? rawId : undefined;

  const { data: detail, isLoading: detailLoading } = useItineraryDetail(itineraryId);
  const { data: expenses = [], isLoading, isError, error, refetch } = useExpenses(itineraryId);
  const { data: tripItems = [] } = useItineraryTripItems(itineraryId);
  const currentUser = useAppSelector((state) => state.auth.user);

  // Fetch group members if itinerary belongs to a group
  const groupId = detail?.group_id;
  const { data: groupDetail } = useGroup(groupId || undefined);

  const addExpenseMut = useAddExpense();
  const updateExpenseMut = useUpdateExpense();
  const deleteExpenseMut = useDeleteExpense();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ExpenseRequest>({
    name: "",
    amount: 0,
    type: "OTHER",
    method: "CASH",
    trip_item_id: null,
    receipt_image_urls: [],
    paid_by: undefined,
    paid_at: undefined,
  });

  const [strAmount, setStrAmount] = useState("");
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [showTripItemPicker, setShowTripItemPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());

  // Deletion confirm state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; name?: string } | null>(null);

  // Build member options from group or current user
  const memberOptions = useMemo<MemberOption[]>(() => {
    if (groupDetail?.members && groupDetail.members.length > 0) {
      return groupDetail.members.map(m => ({
        id: m.user.id,
        fullName: m.user.fullName,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
      }));
    }
    // Fallback to current user if no group
    if (currentUser?.id) {
      return [{
        id: currentUser.id,
        fullName: currentUser.fullName || currentUser.username || 'Tôi',
        username: currentUser.username,
        avatarUrl: currentUser.avatarUrl,
      }];
    }
    return [];
  }, [groupDetail?.members, currentUser]);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [expenses]);

  const budget = detail?.budget_estimate || 0;
  const isOverBudget = budget > 0 && totalExpense > budget;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      amount: 0,
      type: "OTHER",
      method: "CASH",
      trip_item_id: null,
      receipt_image_urls: [],
      paid_by: currentUser?.id,
      paid_at: new Date().toISOString(),
    });
    setStrAmount("");
    setReceiptImages([]);
    setPaymentDate(new Date());
    setModalVisible(true);
  };

  const handleOpenEdit = (item: ExpenseResponse) => {
    setEditingId(item.id || null);
    setFormData({
      name: item.name || "",
      amount: item.amount || 0,
      description: item.description || "",
      type: item.type || "OTHER",
      method: item.method || "CASH",
      trip_item_id: item.trip_item_id || null,
      receipt_image_urls: item.receipt_image_urls || [],
      paid_by: item.paid_by || currentUser?.id,
      paid_at: item.paid_at || new Date().toISOString(),
    });
    setStrAmount(item.amount ? item.amount.toString() : "");
    setReceiptImages(item.receipt_image_urls || []);
    setPaymentDate(item.paid_at ? new Date(item.paid_at) : new Date());
    setModalVisible(true);
  };

  const handleDelete = (id: string, name?: string) => {
    setExpenseToDelete({ id, name });
    setDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    if (itineraryId && expenseToDelete) {
      deleteExpenseMut.mutate({ itineraryId, expenseId: expenseToDelete.id });
    }
    setDeleteConfirmVisible(false);
    setExpenseToDelete(null);
  };

  const handleSave = async () => {
    if (!itineraryId) return;
    if (!formData.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên chi phí");
      return;
    }
    const numAmt = parseInt(strAmount.replace(/[^0-9]/g, ""), 10);
    if (isNaN(numAmt) || numAmt <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
      return;
    }

    const payload: ExpenseRequest = {
      ...formData,
      amount: numAmt,
      receipt_image_urls: receiptImages,
      paid_at: paymentDate.toISOString(),
    };

    try {
      if (editingId) {
        await updateExpenseMut.mutateAsync({
          itineraryId,
          expenseId: editingId,
          payload,
        });
      } else {
        await addExpenseMut.mutateAsync({
          itineraryId,
          payload,
        });
      }
      setModalVisible(false);
    } catch {
      // hook will report error
    }
  };

  const selectedTripItem = tripItems.find(item => item.id === formData.trip_item_id);
  const selectedMember = memberOptions.find(m => m.id === formData.paid_by);

  if (!itineraryId) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
        <SharedHeader
          showBackButton={true}
          centerElement={<Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Quản lý chi phí</Text>}
          withMenuDrawer={false}
          showBorderBottom={false}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text>Thiếu mã lịch trình</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF", paddingTop: insets.top }}>
      {/* Header */}
      <SharedHeader
        showBackButton={true}
        centerElement={<Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Quản lý chi phí</Text>}
        withMenuDrawer={false}
        showBorderBottom={false}
      />

      <ScrollView className="flex-1 pt-4 bg-[#F9FAFB]" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Budget Card */}
        <View className="mx-4 mb-6 rounded-2xl bg-[#2BB673] p-5 shadow-sm">
          <Text className="text-white opacity-80 mb-1 text-sm">Tổng chi phí</Text>
          <Text className="text-white text-3xl font-bold mb-4">{totalExpense.toLocaleString("vi-VN")} ₫</Text>

          {budget > 0 && (
            <View className="flex-row justify-between items-center pt-3 border-t border-white/20">
              <View>
                <Text className="text-white opacity-80 text-xs text-center pr-2">Ngân sách dự kiến</Text>
                <Text className="text-white font-semibold">{budget.toLocaleString("vi-VN")} ₫</Text>
              </View>
              {isOverBudget ? (
                <View className="bg-red-500/20 px-2 py-1 rounded border border-red-200">
                  <Text className="text-red-100 text-xs font-bold text-center">Vượt quỹ</Text>
                </View>
              ) : (
                <View className="bg-white/20 px-2 py-1 rounded">
                  <Text className="text-white text-xs font-bold">Còn dư: {(budget - totalExpense).toLocaleString("vi-VN")} ₫</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Expenses List */}
        <View className="px-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Danh sách chi tiêu</Text>
          
          {isLoading ? (
            <View className="py-10 items-center">
              <ActivityIndicator color="#2BB673" size="large" />
            </View>
          ) : isError ? (
            <View className="py-10 items-center">
              <Text className="text-red-500">{(error as Error)?.message || "Có lỗi xảy ra"}</Text>
              <TouchableOpacity onPress={() => void refetch()} className="mt-3 bg-gray-200 px-4 py-2 rounded">
                <Text>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : expenses.length === 0 ? (
            <View className="py-10 items-center border border-dashed border-gray-300 rounded-xl bg-white">
              <Ionicons name="receipt-outline" size={48} color="#9CA3AF" />
              <Text className="mt-4 text-gray-500 text-sm">Chưa có khoản chi nào!</Text>
            </View>
          ) : (
<View className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              {expenses.map((item, index) => {
                const cat = getCategoryData(item.type);
                const hasReceipts = item.receipt_image_urls && item.receipt_image_urls.length > 0;
                const payerName = item.paid_by_user?.fullName || item.paid_by_user?.full_name || 'Không rõ';
                const paymentTime = item.paid_at ? formatDateTime(new Date(item.paid_at)) : '';

                return (
                  <TouchableOpacity
                    key={item.id}
                    className={`p-4 ${index !== expenses.length - 1 ? 'border-b border-gray-100' : ''}`}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <View className="flex-row items-start">
                      <View className={`w-12 h-12 rounded-full items-center justify-center ${cat.bg}`}>
                        <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-xs text-gray-500 mt-0.5">{cat.name}</Text>

                        {/* Trip item tag */}
                        {item.trip_item && (
                          <View className="flex-row items-center mt-2">
                            <Ionicons name="location" size={14} color="#2BB673" />
                            <Text className="text-xs text-[#2BB673] ml-1" numberOfLines={1}>
                              {item.trip_item.location?.name || 'Địa điểm'}
                            </Text>
                          </View>
                        )}

                        {/* Payer & time */}
                        <View className="flex-row items-center mt-1.5 flex-wrap" style={{ gap: 8 }}>
                          {item.paid_by_user && (
                            <View className="flex-row items-center">
                              <Ionicons name="person-outline" size={12} color="#6B7280" />
                              <Text className="text-xs text-gray-500 ml-1">{payerName}</Text>
                            </View>
                          )}
                          {paymentTime && (
                            <View className="flex-row items-center">
                              <Ionicons name="time-outline" size={12} color="#6B7280" />
                              <Text className="text-xs text-gray-500 ml-1">{paymentTime}</Text>
                            </View>
                          )}
                        </View>

                        {/* Receipt thumbnails */}
                        {hasReceipts && (
                          <View className="flex-row mt-2" style={{ gap: 6 }}>
                            {item.receipt_image_urls!.slice(0, 3).map((url, idx) => (
                              <Image
                                key={idx}
                                source={{ uri: url }}
                                className="w-12 h-12 rounded-lg"
                                contentFit="cover"
                              />
                            ))}
                          </View>
                        )}
                      </View>

                      <View className="items-end ml-2">
                        <Text className="text-base font-bold text-gray-900">
                          {item.amount ? item.amount.toLocaleString("vi-VN") : "0"} ₫
                        </Text>
                        <TouchableOpacity
                          className="mt-2"
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id!, item.name);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

      </ScrollView>

      {/* FAB - Using absolute positioning but taking insets into account */}
      <TouchableOpacity
        className="absolute w-14 h-14 bg-[#2BB673] rounded-full items-center justify-center shadow-lg"
        style={{
          bottom: Math.max(insets.bottom, 24) + 24,
          right: 20,
          elevation: 4
        }}
        onPress={handleOpenAdd}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modal Add/Edit */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Khoảng trống để không bị đè lên status bar trên Android */}
          <View style={{ height: Platform.OS === 'android' ? insets.top : 0 }} />
          <View className="flex-row items-center border-b border-gray-200 px-2 py-3 bg-white">
            <TouchableOpacity onPress={() => setModalVisible(false)} className="px-3" hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color="#000" />
            </TouchableOpacity>
            <Text className="text-lg font-bold flex-1 text-center text-black">
              {editingId ? "Sửa khoản chi" : "Thêm khoản chi"}
            </Text>
            <View className="w-12" />
          </View>
          
          <KeyboardAwareScrollView
            className="flex-1"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
            enableOnAndroid={true}
            extraScrollHeight={20}
            keyboardOpeningTime={0}
          >
              {/* Tên */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">Tên khoản chi <Text className="text-red-500">*</Text></Text>
                <TextInput
                  value={formData.name}
                  onChangeText={(t) => setFormData({ ...formData, name: t })}
                  placeholder="Ví dụ: Vé máy bay"
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base"
                />
              </View>

              {/* Số tiền */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">Số tiền <Text className="text-red-500">*</Text></Text>
                <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-4">
                  <TextInput
                    value={strAmount}
                    onChangeText={setStrAmount}
                    keyboardType="numeric"
                    placeholder="0"
                    className="flex-1 py-3.5 text-base flex-row items-center"
                  />
                  <Text className="font-semibold text-gray-500">VNĐ</Text>
                </View>
              </View>

              {/* Danh mục */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">Danh mục</Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setFormData({ ...formData, type: cat.id })}
                      className={`flex-row items-center px-3 py-2 rounded-lg border ${
                        formData.type === cat.id ? 'border-primary bg-emerald-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Ionicons name={cat.icon as any} size={16} color={formData.type === cat.id ? '#34B27D' : cat.color} />
                      <Text className={`ml-2 text-sm ${formData.type === cat.id ? 'text-primary font-semibold' : 'text-gray-600'}`}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Trip Item Picker */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">Địa điểm liên quan</Text>
                <TouchableOpacity
                  onPress={() => setShowTripItemPicker(true)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons
                      name={formData.trip_item_id ? "location" : "close-circle-outline"}
                      size={20}
                      color={formData.trip_item_id ? "#2BB673" : "#6B7280"}
                    />
                    <Text className="ml-2 text-base text-gray-700" numberOfLines={1}>
                      {selectedTripItem?.location?.name || 'Không gắn địa điểm'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Receipt Images */}
              <View className="mb-5">
                <ReceiptImagePicker
                  images={receiptImages}
                  onChange={setReceiptImages}
                  maxImages={3}
                />
              </View>

              {/* Payer Picker */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">Người thanh toán</Text>
                <TouchableOpacity
                  onPress={() => setShowMemberPicker(true)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="person-outline" size={20} color="#6B7280" />
                    <Text className="ml-2 text-base text-gray-700" numberOfLines={1}>
                      {selectedMember?.fullName || 'Chọn người thanh toán'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Payment Date Time */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">Thời gian thanh toán</Text>
                <TouchableOpacity
                  onPress={() => setShowDateTimePicker(true)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={20} color="#6B7280" />
                    <Text className="ml-2 text-base text-gray-700">
                      {formatDateTime(paymentDate)}
                    </Text>
                  </View>
                  <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Mô tả */}
              <View className="mb-5">
                <Text className="text-sm font-semibold text-gray-700 mb-1.5">Ghi chú thêm</Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(t) => setFormData({ ...formData, description: t })}
                  placeholder="Ghi chú chi tiết..."
                  multiline
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base min-h-[80px]"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>
            <View style={{ paddingBottom: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
              <TouchableOpacity
                onPress={handleSave}
                disabled={addExpenseMut.isPending || updateExpenseMut.isPending}
                className={`py-3.5 rounded-full items-center justify-center ${
                  addExpenseMut.isPending || updateExpenseMut.isPending ? "bg-gray-400" : "bg-primary"
                }`}
              >
                {addExpenseMut.isPending || updateExpenseMut.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-base">Lưu khoản chi</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>
        </View>
      </Modal>
      
      <AppDialogModal
        visible={deleteConfirmVisible}
        variant="warning"
        title="Xóa chi phí"
        message={`Bạn có chắc muốn xóa chi phí "${expenseToDelete?.name || 'này'}"?`}
        primaryLabel="Xóa"
        primaryDestructive
        onPrimaryPress={confirmDelete}
        secondaryLabel="Hủy"
        onSecondaryPress={() => setDeleteConfirmVisible(false)}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      />

      {/* Trip Item Picker Modal */}
      <TripItemPicker
        visible={showTripItemPicker}
        onClose={() => setShowTripItemPicker(false)}
        tripItems={tripItems}
        selectedItemId={formData.trip_item_id}
        onSelect={(itemId) => setFormData({ ...formData, trip_item_id: itemId })}
      />

      {/* Member Picker Modal */}
      <MemberPicker
        visible={showMemberPicker}
        onClose={() => setShowMemberPicker(false)}
        members={memberOptions}
        selectedMemberId={formData.paid_by}
        onSelect={(memberId) => setFormData({ ...formData, paid_by: memberId })}
        title="Chọn người thanh toán"
      />

      {/* DateTime Picker */}
      {showDateTimePicker && (
        <DateTimePicker
          value={paymentDate}
          mode="datetime"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDateTimePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setPaymentDate(selectedDate);
            }
          }}
        />
      )}
    </View>
  );
}
