import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Image } from "expo-image";
import { useExpenses, useAddExpense, useUpdateExpense, useDeleteExpense, useExpenseSummary } from "@/hooks/useExpenses";
import { useItineraryDetail, useItineraryTripItems } from "@/hooks/useItineraries";
import { ExpenseRequest, ExpenseResponse } from "@/services/itineraries";
import { SharedHeader } from "@/components/common/SharedHeader";
import { TripItemPicker } from "@/components/expense/TripItemPicker";
import { MemberPicker, type MemberOption } from "@/components/expense/MemberPicker";
import { ReceiptImagePicker } from "@/components/expense/ReceiptImagePicker";
import { useAppSelector } from "@/store/hooks";
import { useGroup } from "@/hooks/useGroups";
import { AttachedMediaGalleryModal } from "@/components/create-post/AttachedMediaGalleryModal";

const EXPENSE_CATEGORIES = [
  { id: "FOOD", name: "Ăn uống", icon: "restaurant-outline", color: "#F59E0B", bg: "#FEF3C7" }, // amber-100
  { id: "TRANSPORT", name: "Di chuyển", icon: "car-outline", color: "#3B82F6", bg: "#DBEAFE" }, // blue-100
  { id: "ACCOMMODATION", name: "Chỗ ở", icon: "bed-outline", color: "#8B5CF6", bg: "#F3E8FF" }, // purple-100
  { id: "ACTIVITY", name: "Hoạt động", icon: "ticket-outline", color: "#EC4899", bg: "#FCE7F3" }, // pink-100
  { id: "OTHER", name: "Khác", icon: "shapes-outline", color: "#6B7280", bg: "#F3F4F6" }, // gray-100
];

function getCategoryData(type?: string) {
  const norm = (type || "").toUpperCase();
  const found = EXPENSE_CATEGORIES.find((c) => c.id === norm);
  return found || EXPENSE_CATEGORIES[4];
}

function safeFormatDateTime(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${hours}:${minutes}, ${day}/${month}/${year}`;
  } catch {
    return '';
  }
}

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
  const { itineraryId: rawId } = useLocalSearchParams<{ itineraryId?: string }>();
  const itineraryId = typeof rawId === "string" ? rawId : undefined;

  const [filterPaidById, setFilterPaidById] = useState<string | undefined>(undefined);

  const { data: detail, isLoading: detailLoading } = useItineraryDetail(itineraryId);
  const isCompleted = detail?.status === "COMPLETED";
  const { data: expenses = [], isLoading, isError, error, refetch } = useExpenses(itineraryId, filterPaidById);
  const { data: expenseSummary, isLoading: summaryLoading, error: summaryError } = useExpenseSummary(itineraryId);

  const isHiddenExpense = useMemo(() => {
    const checkError = (err: any) => {
      if (!err) return false;
      return (
        err.status === 403 ||
        err.response?.status === 403 ||
        err.response?.data?.code === 1004 ||
        err.message?.includes("1004") ||
        err.message?.toLowerCase().includes("unauthorized")
      );
    };
    return checkError(error) || checkError(summaryError);
  }, [error, summaryError]);
  const { data: tripItems = [] } = useItineraryTripItems(itineraryId);
  const currentUser = useAppSelector((state) => state.auth.user);

  const groupId = detail?.group_id;
  const { data: groupDetail } = useGroup(groupId || undefined);

  const addExpenseMut = useAddExpense();
  const updateExpenseMut = useUpdateExpense();
  const deleteExpenseMut = useDeleteExpense();

  // Mode: 'list' or 'form'
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<ExpenseRequest>({
    name: "",
    amount: 0,
    type: "OTHER",
    method: "CASH",
    trip_item_id: null,
    receipt_image_urls: [],
    paid_by_id: undefined,
    paid_at: undefined,
  });

  const [strAmount, setStrAmount] = useState("");
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [showTripItemPicker, setShowTripItemPicker] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());

  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ uri: string; kind: "image" | "video" }[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const handleOpenDatePicker = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: paymentDate,
        onChange: (event, selectedDate) => {
          if (event.type === 'set' && selectedDate) {
            setPaymentDate(selectedDate);
            DateTimePickerAndroid.open({
              value: selectedDate,
              mode: 'time',
              onChange: (timeEvent, selectedTime) => {
                if (timeEvent.type === 'set' && selectedTime) {
                  setPaymentDate(selectedTime);
                }
              }
            });
          }
        },
        mode: 'date',
      });
    } else {
      setShowDateTimePicker(true);
    }
  };

  const memberOptions = useMemo<MemberOption[]>(() => {
    if (groupDetail?.members && groupDetail.members.length > 0) {
      return groupDetail.members.map(m => ({
        id: m.user.id,
        fullName: m.user.fullName,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
      }));
    }
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

  const totalExpense = expenseSummary?.totalAmount || 0;

  const budget = detail?.budget_estimate || 0;
  const isOverBudget = budget > 0 && totalExpense > budget;
  const budgetProgress = budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : 0;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: "",
      amount: 0,
      type: "OTHER",
      method: "CASH",
      trip_item_id: null,
      receipt_image_urls: [],
      paid_by_id: currentUser?.id,
      paid_at: new Date().toISOString(),
    });
    setStrAmount("");
    setReceiptImages([]);
    setPaymentDate(new Date());
    setViewMode('form');
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
      paid_by_id: (typeof item.paid_by === 'object' && item.paid_by !== null ? (item.paid_by as any).id : item.paid_by) || currentUser?.id,
      paid_at: item.paid_at || new Date().toISOString(),
    });
    setStrAmount(item.amount ? item.amount.toString() : "");
    setReceiptImages(item.receipt_image_urls || []);
    setPaymentDate(item.paid_at ? new Date(item.paid_at) : new Date());
    setViewMode('form');
  };

  const handleDelete = (id: string, name?: string) => {
    Alert.alert(
      "Xóa chi phí",
      `Bạn có chắc chắn muốn xóa chi phí "${name || ''}"? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive", 
          onPress: () => {
            if (itineraryId) {
              deleteExpenseMut.mutate({ itineraryId, expenseId: id });
            }
          }
        }
      ]
    );
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

    const tzOffset = paymentDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(paymentDate.getTime() - tzOffset).toISOString().slice(0, 19);

    const payload: ExpenseRequest = {
      ...formData,
      amount: numAmt,
      receipt_image_urls: receiptImages,
      paid_at: localISOTime,
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
      setViewMode('list');
    } catch {
      // hook will report error
    }
  };

  const selectedTripItem = tripItems.find(item => item.id === formData.trip_item_id);
  const selectedMember = memberOptions.find(m => m.id === formData.paid_by_id);

  if (isHiddenExpense) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
        <SharedHeader
          showBackButton={true}
          centerElement={<Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Chi phí chuyến đi</Text>}
          withMenuDrawer={false}
          showBorderBottom={true}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, backgroundColor: "#FFFFFF" }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: "#FEF2F2",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#FCA5A5",
          }}>
            <Ionicons name="lock-closed" size={36} color="#DC2626" />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 8, textAlign: "center" }}>
            Chi phí đã bị ẩn
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 22 }}>
            Chi phí chuyến đi này đã được người đăng ẩn đi. Chỉ thành viên chuyến đi mới có quyền xem chi phí.
          </Text>
        </View>
      </View>
    );
  }

  if (!itineraryId) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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

  // --- RENDER FORM MODE ---
  if (viewMode === 'form') {
    return (
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        <SharedHeader
          showBackButton={true}
          onBackPress={() => setViewMode('list')}
          centerElement={
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>
              {editingId ? "Sửa chi phí" : "Thêm chi phí"}
            </Text>
          }
          withMenuDrawer={false}
          showBorderBottom={true}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
        >
          <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Tên chi phí *</Text>
              <TextInput
                value={formData.name}
                onChangeText={(val) => setFormData((prev) => ({ ...prev, name: val }))}
                placeholder="Vd: Ăn tối nhà hàng..."
                style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 16 }}
                placeholderTextColor="#9CA3AF"
                editable={!isCompleted}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Số tiền (VNĐ) *</Text>
              <TextInput
                value={strAmount}
                onChangeText={(val) => {
                  const numStr = val.replace(/[^0-9]/g, "");
                  const formatted = numStr ? parseInt(numStr, 10).toLocaleString("vi-VN") : "";
                  setStrAmount(formatted);
                }}
                placeholder="0"
                keyboardType="numeric"
                style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', fontSize: 16, fontWeight: 'bold', color: '#2BB673' }}
                placeholderTextColor="#9CA3AF"
                editable={!isCompleted}
              />
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Phân loại</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {EXPENSE_CATEGORIES.map((c) => {
                  const isSel = formData.type === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setFormData((prev) => ({ ...prev, type: c.id }))}
                      disabled={isCompleted}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
                        flexDirection: 'row', alignItems: 'center', borderWidth: 1,
                        backgroundColor: isSel ? '#F0FDF4' : '#FFFFFF',
                        borderColor: isSel ? '#2BB673' : '#E5E7EB',
                        opacity: isCompleted ? 0.8 : 1,
                      }}
                    >
                      <Ionicons name={c.icon as any} size={16} color={isSel ? '#2BB673' : '#6B7280'} />
                      <Text 
                        style={{ marginLeft: 6, fontSize: 14, fontWeight: isSel ? '600' : '400', color: isSel ? '#2BB673' : '#4B5563' }}
                      >
                        {c.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Hoạt động trong lịch trình</Text>
              <TouchableOpacity
                onPress={() => setShowTripItemPicker(true)}
                disabled={isCompleted}
                style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: isCompleted ? 0.8 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="map-outline" size={16} color="#3B82F6" />
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, color: selectedTripItem ? '#111827' : '#9CA3AF' }} numberOfLines={1}>
                    {selectedTripItem?.location?.name || 'Gắn với hoạt động...'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
              {selectedTripItem && !isCompleted && (
                <TouchableOpacity 
                  onPress={() => setFormData(prev => ({ ...prev, trip_item_id: null }))}
                  style={{ marginTop: 8, alignSelf: 'flex-start' }}
                >
                  <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '500' }}>Bỏ chọn</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Người thanh toán</Text>
              <TouchableOpacity
                onPress={() => setShowMemberPicker(true)}
                disabled={isCompleted}
                style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: isCompleted ? 0.8 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {selectedMember?.avatarUrl ? (
                    <Image
                      source={{ uri: selectedMember.avatarUrl }}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Ionicons name="person" size={16} color="#6B7280" />
                    </View>
                  )}
                  <Text style={{ fontSize: 16, color: '#111827', marginLeft: 12 }}>
                    {selectedMember?.fullName || selectedMember?.username || 'Chọn người chi'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Thời gian chi</Text>
              <TouchableOpacity
                onPress={handleOpenDatePicker}
                disabled={isCompleted}
                style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: isCompleted ? 0.8 : 1 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
                  </View>
                  <Text style={{ fontSize: 16, color: '#111827' }}>
                    {safeFormatDateTime(paymentDate.toISOString()) || "Chọn thời gian"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Hóa đơn / Chứng từ</Text>
              <ReceiptImagePicker
                images={receiptImages}
                onChange={setReceiptImages}
                disabled={isCompleted}
                onImagePress={(index) => {
                  setGalleryImages(
                    receiptImages.map((imgUrl) => ({
                      uri: imgUrl,
                      kind: "image",
                    }))
                  );
                  setGalleryIndex(index);
                  setGalleryVisible(true);
                }}
              />
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' }}>
            {isCompleted ? (
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={{
                  paddingVertical: 16, borderRadius: 12, alignItems: 'center',
                  justifyContent: 'center', backgroundColor: '#9CA3AF',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Quay lại</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSave}
                disabled={addExpenseMut.isPending || updateExpenseMut.isPending}
                style={{
                  paddingVertical: 16, borderRadius: 12, alignItems: 'center',
                  flexDirection: 'row', justifyContent: 'center', backgroundColor: '#2BB673',
                  opacity: addExpenseMut.isPending || updateExpenseMut.isPending ? 0.5 : 1,
                }}
              >
                {(addExpenseMut.isPending || updateExpenseMut.isPending) && (
                  <ActivityIndicator color="white" style={{ marginRight: 8 }} />
                )}
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Lưu khoản chi</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>

        {showDateTimePicker && Platform.OS === 'ios' && (
          <View style={{ position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 8, paddingBottom: 40, paddingTop: 16, paddingHorizontal: 16, zIndex: 50 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Chọn thời gian</Text>
              <TouchableOpacity onPress={() => setShowDateTimePicker(false)}>
                <Text style={{ color: '#2BB673', fontWeight: '600', fontSize: 16 }}>Xong</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={paymentDate}
              mode="datetime"
              display="spinner"
              onChange={(e, d) => d && setPaymentDate(d)}
            />
          </View>
        )}

        <TripItemPicker
          visible={showTripItemPicker}
          onClose={() => setShowTripItemPicker(false)}
          tripItems={tripItems}
          selectedItemId={formData.trip_item_id}
          onSelect={(id) => setFormData(prev => ({ ...prev, trip_item_id: id }))}
        />

        <MemberPicker
          visible={showMemberPicker}
          onClose={() => setShowMemberPicker(false)}
          members={memberOptions}
          selectedMemberId={formData.paid_by_id}
          onSelect={(id) => setFormData(prev => ({ ...prev, paid_by_id: id }))}
        />

        <AttachedMediaGalleryModal
          visible={galleryVisible}
          items={galleryImages}
          initialIndex={galleryIndex}
          onClose={() => setGalleryVisible(false)}
        />
      </View>
    );
  }

  // --- RENDER LIST MODE ---
  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <SharedHeader
        showBackButton={true}
        centerElement={<Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>Quản lý chi phí</Text>}
        withMenuDrawer={false}
        showBorderBottom={false}
      />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Budget Summary Card */}
        <View style={{ margin: 16, padding: 20, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <View>
              <Text style={{ color: '#6B7280', fontWeight: '500', marginBottom: 4 }}>Tổng chi tiêu</Text>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827' }}>
                {totalExpense.toLocaleString("vi-VN")} <Text style={{ fontSize: 18, color: '#6B7280', fontWeight: '600' }}>₫</Text>
              </Text>
            </View>
            {budget > 0 && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '500', marginBottom: 4 }}>Ngân sách dự kiến</Text>
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#374151' }}>
                  {budget.toLocaleString("vi-VN")} ₫
                </Text>
              </View>
            )}
          </View>

          {budget > 0 && (
            <View>
              <View style={{ height: 10, width: '100%', backgroundColor: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${budgetProgress}%`, backgroundColor: isOverBudget ? '#EF4444' : '#2BB673' }} />
              </View>
              {isOverBudget && (
                <Text style={{ fontSize: 12, color: '#EF4444', fontWeight: '500', marginTop: 8 }}>
                  ⚠️ Đã vượt ngân sách dự kiến!
                </Text>
              )}
            </View>
          )}
        </View>

        {/* User Summaries */}
        {expenseSummary && expenseSummary.userSummaries && expenseSummary.userSummaries.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>Thống kê theo thành viên</Text>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
              {expenseSummary.userSummaries.map((us, idx) => (
                <View
                  key={us.user.id || idx}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx !== expenseSummary.userSummaries.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {us.user.avatar_url || us.user.avatarUrl ? (
                      <Image
                        source={{ uri: us.user.avatar_url || us.user.avatarUrl }}
                        style={{ width: 32, height: 32, borderRadius: 16 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="person" size={16} color="#6B7280" />
                      </View>
                    )}
                    <View style={{ marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#111827' }}>
                        {us.user.full_name || us.user.fullName || us.user.username || 'Thành viên'}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#6B7280' }}>{us.expenseCount} khoản chi</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2BB673' }}>
                    {us.totalPaid.toLocaleString('vi-VN')} ₫
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Member Filter */}
        {memberOptions.length > 0 && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setFilterPaidById(undefined)}
                style={{
                  paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                  borderWidth: 1, flexDirection: 'row', alignItems: 'center',
                  backgroundColor: !filterPaidById ? '#2BB673' : '#FFFFFF',
                  borderColor: !filterPaidById ? '#2BB673' : '#E5E7EB',
                }}
              >
                <Text style={{ fontWeight: '600', color: !filterPaidById ? '#FFFFFF' : '#4B5563' }}>Tất cả</Text>
              </TouchableOpacity>
              {memberOptions.map(m => (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setFilterPaidById(m.id)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
                    borderWidth: 1, flexDirection: 'row', alignItems: 'center',
                    backgroundColor: filterPaidById === m.id ? '#2BB673' : '#FFFFFF',
                    borderColor: filterPaidById === m.id ? '#2BB673' : '#E5E7EB',
                  }}
                >
                  <Text style={{ fontWeight: '600', color: filterPaidById === m.id ? '#FFFFFF' : '#4B5563' }}>
                    {m.fullName || m.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Expense List */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 96 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>Lịch sử chi tiêu</Text>
            {expenses.length > 0 && (
              <Text style={{ fontSize: 14, color: '#6B7280' }}>{expenses.length} khoản</Text>
            )}
          </View>

          {isLoading || detailLoading ? (
            <View style={{ paddingVertical: 48, alignItems: 'center' }}>
              <ActivityIndicator color="#2BB673" size="large" />
            </View>
          ) : isError ? (
            <View style={{ paddingVertical: 48, alignItems: 'center', paddingHorizontal: 24 }}>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 16, marginTop: 16, textAlign: 'center' }}>Đã có lỗi xảy ra</Text>
              <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 4, textAlign: 'center', marginBottom: 16 }}>{error?.message || 'Không thể tải dữ liệu'}</Text>
              <TouchableOpacity
                onPress={() => refetch()}
                style={{ paddingHorizontal: 24, paddingVertical: 8, backgroundColor: '#F0FDF4', borderRadius: 999, borderWidth: 1, borderColor: '#BBF7D0' }}
              >
                <Text style={{ color: '#2BB673', fontWeight: '600' }}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : expenses.length === 0 ? (
            <View style={{ paddingVertical: 64, alignItems: 'center', paddingHorizontal: 32, backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6', borderStyle: 'dashed' }}>
              <View style={{ width: 80, height: 80, backgroundColor: '#F0FDF4', borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Ionicons name="receipt-outline" size={36} color="#2BB673" />
              </View>
              <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 18, marginBottom: 8 }}>Chưa có khoản chi nào</Text>
              <Text style={{ color: '#6B7280', textAlign: 'center', lineHeight: 20 }}>Ghi chép lại các chi phí trong chuyến đi để dễ dàng quản lý ngân sách nhé!</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, overflow: 'hidden', marginBottom: 32 }}>
              {expenses.map((item, index) => {
                const cat = getCategoryData(item.type);
                const hasReceipts = item.receipt_image_urls && item.receipt_image_urls.length > 0;
                const payerObj = (typeof item.paid_by === 'object' && item.paid_by !== null) ? item.paid_by : item.user;
                const payerName = payerObj?.fullName || payerObj?.full_name || payerObj?.username || 'Không rõ';
                const payerAvatar = payerObj?.avatarUrl || payerObj?.avatar_url;
                const paymentTime = safeFormatDateTime(item.paid_at);
                const isLast = index === expenses.length - 1;

                return (
                  <TouchableOpacity
                    key={item.id || `expense-${index}`}
                    style={{ padding: 16, borderBottomWidth: !isLast ? 1 : 0, borderBottomColor: '#F9FAFB' }}
                    onPress={() => handleOpenEdit(item)}
                    activeOpacity={0.6}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: cat.bg }}>
                        <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 2 }} numberOfLines={1}>
                          {item.name || 'Khoản chi không tên'}
                        </Text>
                        <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginBottom: 8 }}>{cat.name}</Text>

                        {item.trip_item && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, backgroundColor: '#F0FDF4', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Ionicons name="location" size={12} color="#2BB673" />
                            <Text style={{ fontSize: 11, fontWeight: '600', color: '#2BB673', marginLeft: 4 }} numberOfLines={1}>
                              {item.trip_item.location?.name || 'Địa điểm'}
                            </Text>
                          </View>
                        )}

                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          {payerObj && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              {payerAvatar ? (
                                <Image
                                  source={{ uri: payerAvatar }}
                                  style={{ width: 18, height: 18, borderRadius: 6 }}
                                  contentFit="cover"
                                />
                              ) : (
                                <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ionicons name="person" size={10} color="#6B7280" />
                                </View>
                              )}
                              <Text style={{ fontSize: 12, fontWeight: '500', color: '#4B5563', marginLeft: 6 }}>{payerName}</Text>
                            </View>
                          )}
                          {paymentTime !== '' && (
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                              <Text style={{ fontSize: 12, fontWeight: '500', color: '#6B7280', marginLeft: 6 }}>{paymentTime}</Text>
                            </View>
                          )}
                        </View>

                        {hasReceipts && (
                          <View style={{ flexDirection: 'row', marginTop: 12, gap: 6 }}>
                            {item.receipt_image_urls!.slice(0, 3).map((url, idx) => (
                              <TouchableOpacity
                                key={`receipt-${idx}`}
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setGalleryImages(
                                    item.receipt_image_urls!.map((imgUrl) => ({
                                      uri: imgUrl,
                                      kind: "image",
                                    }))
                                  );
                                  setGalleryIndex(idx);
                                  setGalleryVisible(true);
                                }}
                                activeOpacity={0.8}
                              >
                                <Image
                                  source={{ uri: url }}
                                  style={{ width: 44, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' }}
                                  contentFit="cover"
                                />
                              </TouchableOpacity>
                            ))}
                            {item.receipt_image_urls!.length > 3 && (
                              <TouchableOpacity
                                onPress={(e) => {
                                  e.stopPropagation();
                                  setGalleryImages(
                                    item.receipt_image_urls!.map((imgUrl) => ({
                                      uri: imgUrl,
                                      kind: "image",
                                    }))
                                  );
                                  setGalleryIndex(3);
                                  setGalleryVisible(true);
                                }}
                                activeOpacity={0.8}
                                style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6B7280' }}>+{item.receipt_image_urls!.length - 3}</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>

                      <View style={{ alignItems: 'flex-end', paddingLeft: 8 }}>
                        <Text style={{ fontSize: 15, fontWeight: '900', color: '#111827' }}>
                          {item.amount ? item.amount.toLocaleString("vi-VN") : "0"} ₫
                        </Text>
                        {!isCompleted && (
                          <TouchableOpacity
                            style={{ marginTop: 12, backgroundColor: '#FEF2F2', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id!, item.name);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="trash" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {!isCompleted && (
        <View style={{ position: 'absolute', bottom: 24, right: 20 }}>
          <TouchableOpacity
            onPress={handleOpenAdd}
            style={{
              width: 56, height: 56, backgroundColor: '#2BB673',
              borderRadius: 28, alignItems: 'center', justifyContent: 'center',
              shadowColor: '#2BB673', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
            }}
          >
            <Ionicons name="add" size={30} color="white" />
          </TouchableOpacity>
        </View>
      )}

      <AttachedMediaGalleryModal
        visible={galleryVisible}
        items={galleryImages}
        initialIndex={galleryIndex}
        onClose={() => setGalleryVisible(false)}
      />
    </View>
  );
}
