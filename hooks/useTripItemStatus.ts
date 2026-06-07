import { itineraryService, UpdateTripItemStatusRequest, TripItemResponse } from '@/services/itineraries';
import { showErrorToast, showSuccessToast } from '@/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useUpdateTripItemStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      itineraryId: string;
      tripItemId: string;
      payload: UpdateTripItemStatusRequest;
    }) => {
      const res = await itineraryService.updateTripItemStatus(
        args.itineraryId,
        args.tripItemId,
        args.payload
      );
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || 'Không cập nhật được trạng thái');
      }
      return res.data;
    },

    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ['itineraries', 'detail', variables.itineraryId, 'items'],
      });

      // Optimistically update to the new value using setQueriesData for safe key matching
      queryClient.setQueriesData<TripItemResponse[]>(
        { queryKey: ['itineraries', 'detail', variables.itineraryId, 'items'] },
        (old) => {
          if (!old) return old;
          return old.map((item) =>
            item.id === variables.tripItemId
              ? {
                  ...item,
                  status: variables.payload.status,
                  rating: variables.payload.rating,
                  review: variables.payload.review,
                  checked_in_at:
                    variables.payload.status === 'CHECKED_IN'
                      ? new Date().toISOString()
                      : item.checked_in_at,
                }
              : item
          );
        }
      );

      // Snapshot previous value for rollback is harder with setQueriesData, 
      // but we can just invalidate on error instead of manually rolling back.
      return {};
    },

    onError: (error, variables, context) => {
      // Rollback on error by invalidating the query
      queryClient.invalidateQueries({
        queryKey: ['itineraries', 'detail', variables.itineraryId, 'items'],
      });
      showErrorToast('Lỗi', error);
    },

    onSuccess: (data, variables) => {
      // Direct update to ensure UI updates immediately with new data
      queryClient.setQueriesData<TripItemResponse[]>(
        { queryKey: ['itineraries', 'detail', variables.itineraryId, 'items'] },
        (old) => {
          if (!old) return old;
          return old.map((item) => (item.id === variables.tripItemId ? data : item));
        }
      );

      // Still invalidate in the background just in case
      queryClient.invalidateQueries({
        queryKey: ['itineraries', 'detail', variables.itineraryId, 'items'],
      });

      // Success message based on status
      const messages = {
        CHECKED_IN: 'Đã check-in thành công',
        SKIPPED: 'Đã bỏ qua địa điểm',
        PENDING: 'Đã hoàn tác',
      };
      showSuccessToast(messages[variables.payload.status] || 'Đã cập nhật');
    },
  });
}
