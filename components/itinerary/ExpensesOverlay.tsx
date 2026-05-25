import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useExpenses,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/hooks/useExpenses";
import { ExpenseRequest, ExpenseResponse } from "@/services/itineraries";
import { SharedHeader } from "@/components/common/SharedHeader";
import { FlashList } from "@shopify/flash-list";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { formatDateSeparator } from "@/utils/timeFormat";
import { formatCurrencyVND } from "@/utils/format";

const { width } = Dimensions.get("window");

const EXPENSE_CATEGORIES = [
  { id: "FOOD", name: "Ăn uống", icon: "restaurant", color: "#F59E0B", bg: "#FEF3C7" },
  { id: "TRANSPORT", name: "Di chuyển", icon: "car", color: "#3B82F6", bg: "#DBEAFE" },
  { id: "ACCOMMODATION", name: "Chỗ ở", icon: "bed", color: "#8B5CF6", bg: "#EDE9FE" },
  { id: "ACTIVITY", name: "Hoạt động", icon: "ticket", color: "#EC4899", bg: "#FCE7F3" },
  { id: "OTHER", name: "Khác", icon: "shapes", color: "#6B7280", bg: "#F3F4F6" },
];

function getCategoryData(type?: string) {
  const norm = (type || "").toUpperCase();
  const found = EXPENSE_CATEGORIES.find((c) => c.id === norm);
  return found || EXPENSE_CATEGORIES[4];
}

interface ExpensesOverlayProps {
  visible: boolean;
  onClose: () => void;
  itineraryId: string;
  itineraryTitle: string;
  budget?: number;
  isCompleted?: boolean;
}

export function ExpensesOverlay({
  visible,
  onClose,
  itineraryId,
  itineraryTitle,
  budget = 0,
  isCompleted = false,
}: ExpensesOverlayProps) {
  const insets = useSafeAreaInsets();
  const { data: expenses = [], isLoading, isError, error, refetch } = useExpenses(itineraryId, { enabled: visible });

  const addExpenseMut = useAddExpense();
  const updateExpenseMut = useUpdateExpense();
  const deleteExpenseMut = useDeleteExpense();

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExpenseRequest>({
    name: "",
    amount: 0,
    type: "OTHER",
    method: "CASH",
  });
  const [strAmount, setStrAmount] = useState("");

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [expenses]);

  const budgetProgress = useMemo(() => {
    if (!budget || budget === 0) return 0;
    return Math.min(totalExpense / budget, 1);
  }, [totalExpense, budget]);

  const groupedExpenses = useMemo(() => {
    const groups: { [key: string]: ExpenseResponse[] } = {};
    expenses.forEach((item) => {
      // Use date string as key for grouping
      const dateObj = item.created_at ? new Date(item.created_at) : null;
      const dateKey = dateObj ? dateObj.toDateString() : "other";
      
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
    });

    // Sort dates descending
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === "other") return 1;
        if (b === "other") return -1;
        return new Date(b).getTime() - new Date(a).getTime();
      })
      .map((date) => ({
        date,
        data: groups[date],
      }));
  }, [expenses]);

  // Flatten for FlashList with headers
  const flattenedData = useMemo(() => {
    const result: any[] = [];
    groupedExpenses.forEach((group) => {
      result.push({ type: "header", title: group.date });
      group.data.forEach((item) => {
        result.push({ type: "item", ...item });
      });
    });
    return result;
  }, [groupedExpenses]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: "", amount: 0, type: "OTHER", method: "CASH" });
    setStrAmount("");
    bottomSheetRef.current?.expand();
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
    bottomSheetRef.current?.expand();
  };

  const handleDelete = (id: string, name?: string) => {
    Alert.alert(
      "Xóa chi phí",
      `Bạn có chắc muốn xóa chi phí "${name || "này"}"?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            deleteExpenseMut.mutate({ itineraryId, expenseId: id });
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên chi phí");
      return;
    }
    const numAmt = parseInt(strAmount.replace(/[^0-9]/g, ""), 10);
    if (isNaN(numAmt) || numAmt <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
      return;
    }

    const payload = { ...formData, amount: numAmt };

    try {
      if (editingId) {
        await updateExpenseMut.mutateAsync({
          itineraryId,
          expenseId: editingId,
          payload,
        });
      } else {
        await addExpenseMut.mutateAsync({ itineraryId, payload });
      }
      bottomSheetRef.current?.close();
    } catch (err) {
      console.error(err);
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
      />
    ),
    []
  );

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: "#F8FAFC" }]}>
      <SharedHeader
        leftElement={
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="chevron-back" size={26} color="#1E293B" />
          </TouchableOpacity>
        }
        centerElement={
          <Text numberOfLines={1} className="text-lg font-bold text-slate-800 max-w-[200px]">
            {itineraryTitle}
          </Text>
        }
        withMenuDrawer={false}
        showBorderBottom={false}
        containerStyle={{ backgroundColor: "transparent" }}
      />

      <View className="flex-1">
        {/* Header Summary */}
        <View className="px-5 pt-2 pb-6">
          <LinearGradient
            colors={["#059669", "#10B981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-3xl p-6 shadow-lg shadow-emerald-200"
          >
            <Text className="text-emerald-50 text-sm font-medium mb-1">Tổng chi tiêu</Text>
            <View className="flex-row items-baseline mb-4">
              <Text className="text-white text-3xl font-bold">
                {totalExpense.toLocaleString("vi-VN")}
              </Text>
              <Text className="text-emerald-100 text-lg ml-1 font-semibold">₫</Text>
            </View>

            {budget > 0 && (
              <View>
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-emerald-50 text-xs">Ngân sách: {formatCurrencyVND(budget)}</Text>
                  <Text className="text-white text-xs font-bold">{Math.round(budgetProgress * 100)}%</Text>
                </View>
                <View className="h-2 bg-emerald-900/20 rounded-full overflow-hidden">
                  <View
                    className={`h-full ${budgetProgress > 0.9 ? "bg-amber-300" : "bg-white"}`}
                    style={{ width: `${budgetProgress * 100}%` }}
                  />
                </View>
                {totalExpense > budget && (
                  <Text className="text-amber-200 text-[10px] mt-1.5 font-bold uppercase tracking-wider">
                    ⚠️ Đã vượt ngân sách dự kiến
                  </Text>
                )}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Expenses List */}
        <View className="flex-1 bg-white rounded-t-[40px] shadow-2xl">
          <View className="flex-row justify-between items-center px-6 pt-8 mb-4">
            <Text className="text-xl font-bold text-slate-800">Lịch sử chi tiêu</Text>
            <TouchableOpacity onPress={() => void refetch()} className="p-1">
              <Ionicons name="refresh-outline" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <FlashList
            data={flattenedData}
            keyExtractor={(item, index) => item.id || `idx-${index}`}
            estimatedItemSize={80}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
            renderItem={({ item }) => {
              if (item.type === "header") {
                const dateStr = item.title === "other" 
                  ? "Chưa rõ ngày" 
                  : formatDateSeparator(item.title);
                return (
                  <View className="py-3 mt-2">
                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      {dateStr}
                    </Text>
                  </View>
                );
              }

              const cat = getCategoryData(item.type);
              return (
                <TouchableOpacity
                  onPress={() => !isCompleted && handleOpenEdit(item)}
                  activeOpacity={isCompleted ? 1 : 0.2}
                  className="flex-row items-center bg-slate-50 rounded-2xl p-4 mb-3 border border-slate-100"
                >
                  <View
                    style={{ backgroundColor: cat.bg }}
                    className="w-12 h-12 rounded-2xl items-center justify-center"
                  >
                    <Ionicons name={cat.icon as any} size={24} color={cat.color} />
                  </View>
                  <View className="flex-1 ml-4">
                    <Text className="text-slate-800 font-bold text-base" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">{cat.name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-900 font-bold text-base">
                      {formatCurrencyVND(item.amount || 0)}
                    </Text>
                    {!isCompleted && (
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id!, item.name)}
                        className="mt-1"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              isLoading ? (
                <ActivityIndicator color="#10B981" size="large" className="mt-10" />
              ) : (
                <View className="items-center mt-10">
                  <View className="w-20 h-20 bg-slate-100 rounded-full items-center justify-center mb-4">
                    <Ionicons name="receipt-outline" size={40} color="#94A3B8" />
                  </View>
                  <Text className="text-slate-400 font-medium">Chưa có khoản chi nào!</Text>
                </View>
              )
            }
          />
        </View>
      </View>

      {/* FAB */}
      {!isCompleted && (
        <TouchableOpacity
          onPress={handleOpenAdd}
          activeOpacity={0.8}
          className="absolute bottom-10 right-6 w-16 h-16 rounded-full bg-emerald-500 items-center justify-center shadow-xl shadow-emerald-400"
          style={{ elevation: 8 }}
        >
          <Ionicons name="add" size={36} color="white" />
        </TouchableOpacity>
      )}

      {/* Add/Edit Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={["60%", "90%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={{ borderRadius: 40, backgroundColor: "#FFFFFF" }}
        handleIndicatorStyle={{ backgroundColor: "#E2E8F0", width: 40 }}
      >
        <BottomSheetView className="flex-1 px-6 pt-2">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-slate-800">
              {editingId ? "Sửa chi tiêu" : "Thêm chi tiêu"}
            </Text>
            <TouchableOpacity onPress={() => bottomSheetRef.current?.close()}>
              <Text className="text-emerald-500 font-bold">Đóng</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-6">
            <View>
              <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Tên khoản chi</Text>
              <BottomSheetTextInput
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
                placeholder="VD: Ăn tối tại chợ đêm"
                className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 text-base"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View className="mt-4">
              <Text className="text-slate-400 text-xs font-bold uppercase mb-2 ml-1">Số tiền (₫)</Text>
              <BottomSheetTextInput
                value={strAmount}
                onChangeText={setStrAmount}
                keyboardType="numeric"
                placeholder="0"
                className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-slate-800 text-2xl font-bold"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View className="mt-4">
              <Text className="text-slate-400 text-xs font-bold uppercase mb-3 ml-1">Danh mục</Text>
              <View className="flex-row flex-wrap" style={{ gap: 10 }}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isActive = formData.type === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setFormData({ ...formData, type: cat.id })}
                      style={{
                        backgroundColor: isActive ? cat.bg : "#F8FAFC",
                        borderColor: isActive ? cat.color : "#F1F5F9",
                      }}
                      className="flex-row items-center px-4 py-2.5 rounded-xl border"
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={18}
                        color={isActive ? cat.color : "#64748B"}
                      />
                      <Text
                        className={`ml-2 font-semibold ${isActive ? "text-slate-800" : "text-slate-500"}`}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSave}
              disabled={addExpenseMut.isPending || updateExpenseMut.isPending}
              className={`mt-8 py-4 rounded-2xl items-center justify-center shadow-lg ${
                addExpenseMut.isPending || updateExpenseMut.isPending ? "bg-slate-300" : "bg-emerald-500 shadow-emerald-200"
              }`}
            >
              {addExpenseMut.isPending || updateExpenseMut.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Lưu chi tiêu</Text>
              )}
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({});

