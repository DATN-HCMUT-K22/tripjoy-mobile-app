import { locationSuggestionService } from "@/services/locationSuggestions";
import { SuggestLocationRequest } from "@/types/locationSuggestion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useLocationSuggestions(groupId: string | undefined) {
  return useQuery({
    queryKey: ["location-suggestions", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const response = await locationSuggestionService.getSuggestions(groupId);
      if ((response.code === 1000 || response.code === 0) && Array.isArray(response.data)) {
        return response.data;
      }
      throw new Error(response.message || "Không thể tải địa điểm gợi ý");
    },
    enabled: !!groupId,
  });
}

export function useCreateLocationSuggestion(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SuggestLocationRequest) => {
      if (!groupId) throw new Error("Thiếu groupId");
      const response = await locationSuggestionService.createSuggestion(groupId, payload);
      if ((response.code === 1000 || response.code === 0) && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Không thể tạo gợi ý");
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["location-suggestions", groupId] });
      }
    },
  });
}

export function useDeleteLocationSuggestion(groupId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (suggestionId: string) => {
      if (!groupId) throw new Error("Thiếu groupId");
      const response = await locationSuggestionService.deleteSuggestion(groupId, suggestionId);
      if (response.code === 1000 || response.code === 0) {
        return true;
      }
      throw new Error(response.message || "Không thể xóa gợi ý");
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["location-suggestions", groupId] });
      }
    },
  });
}
