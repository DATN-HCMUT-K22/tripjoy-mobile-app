import { itineraryService, ExpenseRequest, ExpenseResponse } from "@/services/itineraries";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useExpenses(itineraryId: string | undefined, options?: { enabled?: boolean }) {
  const enabled = !!itineraryId && (options?.enabled ?? true);
  return useQuery({
    queryKey: ["itineraries", "detail", itineraryId, "expenses"],
    queryFn: async (): Promise<ExpenseResponse[]> => {
      if (!itineraryId) return [];
      const res = await itineraryService.getExpenses(itineraryId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được danh sách chi phí");
      }
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { itineraryId: string; payload: ExpenseRequest }) => {
      const res = await itineraryService.addExpense(args.itineraryId, args.payload);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không thêm được chi phí");
      }
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["itineraries", "detail", variables.itineraryId, "expenses"],
      });
      showSuccessToast("Đã thêm chi phí");
    },
    onError: (error) => {
      showErrorToast("Lỗi", error);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { itineraryId: string; expenseId: string; payload: ExpenseRequest }) => {
      const res = await itineraryService.updateExpense(args.itineraryId, args.expenseId, args.payload);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không cập nhật được chi phí");
      }
      return res.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["itineraries", "detail", variables.itineraryId, "expenses"],
      });
      showSuccessToast("Đã cập nhật chi phí");
    },
    onError: (error) => {
      showErrorToast("Lỗi", error);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { itineraryId: string; expenseId: string }) => {
      const res = await itineraryService.deleteExpense(args.itineraryId, args.expenseId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không xóa được chi phí");
      }
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["itineraries", "detail", variables.itineraryId, "expenses"],
      });
      showSuccessToast("Đã xóa chi phí");
    },
    onError: (error) => {
      showErrorToast("Lỗi", error);
    },
  });
}
