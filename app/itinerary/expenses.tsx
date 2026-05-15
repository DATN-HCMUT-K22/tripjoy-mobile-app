import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useExpenses, useAddExpense, useUpdateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { useItineraryDetail } from "@/hooks/useItineraries";
import { ExpenseRequest, ExpenseResponse } from "@/services/itineraries";
import { SharedHeader } from "@/components/common/SharedHeader";
import { AppDialogModal } from "@/components/common/AppDialogModal";

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

export default function ExpensesScreen() {
  // const router = useRouter();
  const insets = useSafeAreaInsets();
  const { itineraryId: rawId } = useLocalSearchParams<{ itineraryId?: string }>();
  const itineraryId = typeof rawId === "string" ? rawId : undefined;

  const { data: detail, isLoading: detailLoading } = useItineraryDetail(itineraryId);
  const { data: expenses = [], isLoading, isError, error, refetch } = useExpenses(itineraryId);

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
  });



  const [strAmount, setStrAmount] = useState("");

  // Deletion confirm state
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; name?: string } | null>(null);

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [expenses]);

  const budget = detail?.budget_estimate || 0;
  const isOverBudget = budget > 0 && totalExpense > budget;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: "", amount: 0, type: "OTHER", method: "CASH" });
    setStrAmount("");
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
    });
    setStrAmount(item.amount ? item.amount.toString() : "");
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

    const payload = {
      ...formData,
      amount: numAmt,
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
                return (
                  <TouchableOpacity
                    key={item.id}
                    className={`flex-row p-4 items-center ${index !== expenses.length - 1 ? 'border-b border-gray-100' : ''}`}
                    onPress={() => handleOpenEdit(item)}
                  >
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${cat.bg}`}>
                      <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                    </View>
                    <View className="flex-1 ml-3 justify-center">
                      <Text className="text-base font-semibold text-gray-900" numberOfLines={1}>{item.name}</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">{cat.name}</Text>
                    </View>
                    <View className="items-end ml-2 justify-center">
                      <Text className="text-base font-bold text-gray-900">
                        {item.amount ? item.amount.toLocaleString("vi-VN") : "0"} ₫
                      </Text>
                      <TouchableOpacity
                        className="mt-2"
                        onPress={() => handleDelete(item.id!, item.name)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
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
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1"
          >
            <ScrollView className="px-5 pt-5 pb-10 flex-1">
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
            </ScrollView>

            <View className="px-5 pb-8 pt-3 border-t border-gray-100">
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
          </KeyboardAvoidingView>
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
    </View>
  );
}
