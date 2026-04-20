import { useMutation, useQueryClient } from '@tanstack/react-query';
import { itineraryService, TripItemRequest } from '@/services/itineraries';
import { showSuccessToast, showErrorToast } from '@/utils/toast';

export function useAddTripItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { itineraryId: string; payload: TripItemRequest }) => {
      const res = await itineraryService.addTripItem(args.itineraryId, args.payload);
      if (res?.code !== 0 && res?.code !== 1000) {
        throw new Error(res?.message || 'Không thể thêm hoạt động');
      }
      return res.data;
    },
    onSuccess: (_, { itineraryId }) => {
      queryClient.invalidateQueries({
        queryKey: ['itineraries', 'detail', itineraryId, 'items'],
      });
      showSuccessToast('Đã thêm hoạt động');
    },
    onError: (error) => {
      showErrorToast('Không thêm được hoạt động', error);
    },
  });
}

export function useUpdateTripItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      itineraryId: string;
      tripItemId: string;
      payload: TripItemRequest;
    }) => {
      const res = await itineraryService.updateTripItem(
        args.itineraryId,
        args.tripItemId,
        args.payload
      );
      if (res?.code !== 0 && res?.code !== 1000) {
        throw new Error(res?.message || 'Không thể cập nhật hoạt động');
      }
      return res.data;
    },
    onSuccess: (_, { itineraryId }) => {
      queryClient.invalidateQueries({
        queryKey: ['itineraries', 'detail', itineraryId, 'items'],
      });
      showSuccessToast('Đã cập nhật hoạt động');
    },
    onError: (error) => {
      showErrorToast('Không cập nhật được hoạt động', error);
    },
  });
}

export function useDeleteTripItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { itineraryId: string; tripItemId: string }) => {
      const res = await itineraryService.deleteTripItem(
        args.itineraryId,
        args.tripItemId
      );
      if (res?.code !== 0 && res?.code !== 1000) {
        throw new Error(res?.message || 'Không thể xóa hoạt động');
      }
      return res;
    },
    onSuccess: (_, { itineraryId }) => {
      queryClient.invalidateQueries({
        queryKey: ['itineraries', 'detail', itineraryId, 'items'],
      });
      showSuccessToast('Đã xóa hoạt động');
    },
    onError: (error) => {
      showErrorToast('Không xóa được hoạt động', error);
    },
  });
}
