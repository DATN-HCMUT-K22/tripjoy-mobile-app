import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockItineraries } from "@/data/mockItineraries";
import {
  itineraryService,
  ItineraryRequest,
  ItineraryResponse,
  GenerateItineraryRequest,
  ITINERARY_STATUS,
  type AiModifyItineraryRequest,
  type TripItemResponse,
} from "@/services/itineraries";
import type { Itinerary as DisplayItinerary } from "@/types/group";
import { parseItineraryDateToDayOnly, tripPickerDateToItineraryDateTime } from "@/utils/itineraryDates";
import { timeAgo } from "@/utils/format";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

const PLACEHOLDER_ITINERARY_IMAGE =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400";

export type GroupItineraryTab = "ongoing" | "completed" | "draft";

export type GroupInfoItineraryListItem = {
  id: string;
  name: string;
  image: string;
  startDate: string;
  endDate: string;
  budget?: number;
  createdAtLabel: string;
  raw?: ItineraryResponse;
};

export type GroupItinerariesByTab = {
  ongoing: GroupInfoItineraryListItem[];
  completed: GroupInfoItineraryListItem[];
  draft: GroupInfoItineraryListItem[];
  totalCount: number;
};

function mapApiItineraryToDisplay(api: ItineraryResponse): DisplayItinerary {
  const startDate = parseItineraryDateToDayOnly(api.start_date ?? "");
  const endDate = parseItineraryDateToDayOnly(api.end_date ?? startDate);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startTs = start.getTime();
  const endTs = end.getTime();
  const calendarDays =
    Number.isNaN(startTs) || Number.isNaN(endTs)
      ? 1
      : Math.max(1, Math.floor((endTs - startTs) / 86400000) + 1);
  const nights = calendarDays > 1 ? calendarDays - 1 : 0;
  const budgetFromApi =
    typeof api.budget_estimate === "number" && !Number.isNaN(api.budget_estimate)
      ? api.budget_estimate
      : 0;
  const memberFromApi =
    typeof api.people_quantity === "number" && !Number.isNaN(api.people_quantity)
      ? api.people_quantity
      : typeof api.member_count === "number" && !Number.isNaN(api.member_count)
        ? api.member_count
        : 0;
  const imageFromApi =
    [api.cover_image_url, api.thumbnail_url]
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .find((u) => u.length > 0) ?? "";
  return {
    id: api.id ?? "",
    groupId: api.group_id ?? "",
    name: api.title ?? "Lịch trình chưa đặt tên",
    image: imageFromApi,
    startDate,
    endDate,
    duration: nights > 0 ? `${calendarDays} ngày ${nights} đêm` : `${calendarDays} ngày`,
    memberCount: memberFromApi,
    budget: budgetFromApi,
    status: api.status,
  };
}

function resolveTabByDates(startDate: string, endDate: string): GroupItineraryTab {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endStr = endDate || startDate;
  const start = new Date(startDate);
  const end = new Date(endStr);
  const endIncl = new Date(end);
  endIncl.setHours(23, 59, 59, 999);
  if (Number.isNaN(start.getTime()) && Number.isNaN(end.getTime())) return "draft";
  if (!Number.isNaN(start.getTime()) && start > today) return "ongoing";
  if (!Number.isNaN(endIncl.getTime()) && endIncl < today) return "completed";
  return "ongoing";
}

function normalizeStatus(raw?: string): string {
  return (raw ?? "").toUpperCase().replace(/-/g, "_");
}

/**
 * Gom tab UI (Đang diễn ra / Đã xong / Nháp) theo `ItineraryStatus` + ngày.
 */
function resolveItineraryTab(
  api: ItineraryResponse,
  startDate: string,
  endDate: string
): GroupItineraryTab {
  const s = normalizeStatus(api.status);

  if (
    s === ITINERARY_STATUS.PENDING ||
    s === ITINERARY_STATUS.GENERATING ||
    s === ITINERARY_STATUS.FAILED
  ) {
    return "draft";
  }
  if (s === ITINERARY_STATUS.COMPLETED) {
    return "completed";
  }
  if (s === ITINERARY_STATUS.IN_PROGRESS) {
    return "ongoing";
  }
  if (s === ITINERARY_STATUS.DRAFT) {
    return "draft";
  }
  if (s === ITINERARY_STATUS.CONFIRMED) {
    return resolveTabByDates(startDate, endDate);
  }

  if (
    s.includes("COMPLETE") ||
    s.includes("DONE") ||
    s.includes("FINISHED") ||
    s.includes("ARCHIVED") ||
    s.includes("CLOSED")
  ) {
    return "completed";
  }
  if (
    s.includes("ONGOING") ||
    s.includes("ACTIVE") ||
    s.includes("RUNNING") ||
    s.includes("IN_PROGRESS")
  ) {
    return "ongoing";
  }
  if (
    s.includes("DRAFT") ||
    s === "NHAP" ||
    s === "PENDING" ||
    s === "NEW" ||
    s === "PLANNING"
  ) {
    return "draft";
  }

  return resolveTabByDates(startDate, endDate);
}

/**
 * Danh sách lịch của user: GET `/itineraries/me`.
 */
export function useItineraries(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: ["itineraries", "me"],
    queryFn: async (): Promise<DisplayItinerary[]> => {
      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 200));
        return mockItineraries;
      }
      const res = await itineraryService.getMyItineraries();
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được danh sách lịch trình");
      }
      const list = (Array.isArray(res?.data) ? res.data : []).filter((api) => {
        const s = normalizeStatus(api.status);
        return s !== ITINERARY_STATUS.FAILED && s !== ITINERARY_STATUS.GENERATING;
      });
      return list.map(mapApiItineraryToDisplay);
    },
    staleTime: 60 * 1000,
    enabled,
  });
}

/** GET `/itineraries/{itineraryId}/favorites` */
export function useFavoriteItineraries(itineraryId: string | undefined) {
  return useQuery({
    queryKey: ["itineraries", "favorites", itineraryId],
    queryFn: async (): Promise<DisplayItinerary[]> => {
      if (!itineraryId) return [];
      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 200));
        return [];
      }
      const res = await itineraryService.getFavoriteItineraries(itineraryId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được lịch yêu thích");
      }
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map(mapApiItineraryToDisplay);
    },
    enabled: !!itineraryId,
    staleTime: 60 * 1000,
  });
}

/**
 * Chi tiết một lịch; tự poll khi `status === GENERATING` (flow AI).
 */
export function useItineraryDetail(
  itineraryId: string | undefined,
  options?: { enabled?: boolean; pollWhileGenerating?: boolean }
) {
  const enabled = !!itineraryId && (options?.enabled !== false);
  const poll = options?.pollWhileGenerating !== false;

  return useQuery({
    queryKey: ["itineraries", "detail", itineraryId],
    queryFn: async (): Promise<ItineraryResponse | null> => {
      if (!itineraryId) return null;
      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 200));
        const mock = mockItineraries.find((it) => it.id === itineraryId);
        if (mock) {
          return {
            id: mock.id,
            title: mock.name,
            status: ITINERARY_STATUS.DRAFT,
            start_date: mock.startDate,
            end_date: mock.endDate,
            people_quantity: mock.memberCount,
            budget_estimate: mock.budget,
          };
        }
      }
      const res = await itineraryService.getItineraryById(itineraryId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được lịch trình");
      }
      return res.data ?? null;
    },
    enabled,
    staleTime: 30 * 1000,
    /** Tài liệu: poll GET mỗi 3–5s khi AI đang sinh lịch */
    refetchInterval: (q) => {
      const d = q.state.data;
      const st = normalizeStatus(d?.status);
      return poll && (st === ITINERARY_STATUS.PENDING || st === ITINERARY_STATUS.GENERATING) ? 4000 : false;
    },
  });
}

/** GET `/itineraries/{id}/items` — hoạt động theo ngày/giờ. */
export function useItineraryTripItems(
  itineraryId: string | undefined,
  options?: {
    enabled?: boolean;
    /**
     * Trạng thái lịch (từ GET detail). Khi `GENERATING`, poll items cùng nhịp với detail
     * để sau ai-modify / ai-generate vẫn thấy địa điểm mới khi BE cập nhật xong.
     */
    itineraryStatus?: string;
    pollWhileGenerating?: boolean;
  }
) {
  const enabled = !!itineraryId && (options?.enabled ?? true);
  const poll = options?.pollWhileGenerating !== false;
  const itemStatusNorm = normalizeStatus(options?.itineraryStatus);

  const itemsRefetchInterval = useMemo(() => {
    if (!poll) return false;
    return itemStatusNorm === ITINERARY_STATUS.PENDING || itemStatusNorm === ITINERARY_STATUS.GENERATING ? 4000 : false;
  }, [poll, itemStatusNorm]);

  return useQuery({
    queryKey: ["itineraries", "detail", itineraryId, "items"],
    queryFn: async (): Promise<TripItemResponse[]> => {
      if (!itineraryId) return [];
      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 150));
        // Return some dummy items for the mocked itinerary
        return [
          {
            id: "m1",
            location_id: "loc1",
            start_time: "2025-08-16T08:00:00Z",
            duration: 60,
            location: {
              id: "loc1",
              name: "Điểm tham quan mẫu 1",
              full_address: "Địa chỉ mẫu 1, Nha Trang",
              lat: 12.245,
              lng: 109.194,
            },
          },
          {
            id: "m2",
            location_id: "loc2",
            start_time: "2025-08-16T10:00:00Z",
            duration: 120,
            location: {
              id: "loc2",
              name: "Điểm tham quan mẫu 2",
              full_address: "Địa chỉ mẫu 2, Nha Trang",
              lat: 12.255,
              lng: 109.204,
            },
          },
        ];
      }
      const res = await itineraryService.getTripItems(itineraryId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được hoạt động trong lịch");
      }
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled,
    /** Items đổi sau AI — không giữ cache lâu để back vào lại vẫn thấy bản mới */
    staleTime: 0,
    refetchInterval: itemsRefetchInterval,
  });
}

export function useGroupItinerariesByTab(groupId: string | undefined) {
  return useQuery({
    queryKey: ["itineraries", "group", groupId],
    queryFn: async (): Promise<GroupItinerariesByTab> => {
      if (!groupId) {
        return { ongoing: [], completed: [], draft: [], totalCount: 0 };
      }

      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 200));
        const rows = mockItineraries
          .filter((it) => String(it.groupId) === String(groupId))
          .map((it) => {
            const tab = resolveTabByDates(it.startDate, it.endDate);
            const item: GroupInfoItineraryListItem = {
              id: it.id,
              name: it.name,
              image: it.image || PLACEHOLDER_ITINERARY_IMAGE,
              startDate: it.startDate,
              endDate: it.endDate,
              budget: it.budget > 0 ? it.budget : undefined,
              createdAtLabel: "—",
            };
            return { ...item, tab };
          });
        return {
          ongoing: rows.filter((r) => r.tab === "ongoing").map(({ tab: _t, ...rest }) => rest),
          completed: rows.filter((r) => r.tab === "completed").map(({ tab: _t, ...rest }) => rest),
          draft: rows.filter((r) => r.tab === "draft").map(({ tab: _t, ...rest }) => rest),
          totalCount: rows.length,
        };
      }

      const res = await itineraryService.getItinerariesByGroupId(groupId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được lịch trình nhóm");
      }
      const list = (Array.isArray(res?.data) ? res.data : []).filter((api) => {
        const s = normalizeStatus(api.status);
        return s !== ITINERARY_STATUS.FAILED && s !== ITINERARY_STATUS.GENERATING;
      });
      const rows = list.map((api) => {
        const display = mapApiItineraryToDisplay(api);
        const tab = resolveItineraryTab(api, display.startDate, display.endDate);
        const item: GroupInfoItineraryListItem = {
          id: display.id,
          name: display.name,
          image: display.image || PLACEHOLDER_ITINERARY_IMAGE,
          startDate: display.startDate,
          endDate: display.endDate,
          budget: display.budget > 0 ? display.budget : undefined,
          createdAtLabel: api.created_at ? timeAgo(api.created_at) : "—",
          raw: api,
        };
        return { ...item, tab };
      });

      return {
        ongoing: rows.filter((r) => r.tab === "ongoing").map(({ tab: _t, ...rest }) => rest),
        completed: rows.filter((r) => r.tab === "completed").map(({ tab: _t, ...rest }) => rest),
        draft: rows.filter((r) => r.tab === "draft").map(({ tab: _t, ...rest }) => rest),
        totalCount: rows.length,
      };
    },
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}

/** GET group's CONFIRMED itinerary - hiển thị trong chat banner */
export function useGroupConfirmedItinerary(groupId: string | undefined) {
  return useQuery({
    queryKey: ["itineraries", "group", groupId, "confirmed"],
    queryFn: async () => {
      if (!groupId) return null;

      const res = await itineraryService.getItinerariesByGroupId(groupId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        return null;
      }

      const list = Array.isArray(res?.data) ? res.data : [];

      // Tìm itinerary có status CONFIRMED
      const confirmed = list.find((it) => {
        const status = normalizeStatus(it.status);
        return status === ITINERARY_STATUS.CONFIRMED;
      });

      if (!confirmed) return null;

      // Map sang display format
      const display = mapApiItineraryToDisplay(confirmed);
      return {
        id: display.id,
        name: display.name,
        image: display.image || PLACEHOLDER_ITINERARY_IMAGE,
        startDate: display.startDate,
        endDate: display.endDate,
        budget: display.budget,
      };
    },
    enabled: !!groupId,
    staleTime: 60 * 1000,
  });
}

export function useCreateItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ItineraryRequest) => {
      const res = await itineraryService.createItinerary(payload);
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data ?? {};
      }
      throw new Error(res?.message || "Không thể tạo lịch trình");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      showSuccessToast("Tạo lịch trình thành công");
    },
  });
}

/** POST `/itineraries/ai-generate` (202) — sau đó dùng `useItineraryDetail(id)` để poll. */
export function useGenerateItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: GenerateItineraryRequest) => {
      const res = await itineraryService.generateItinerary(body);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không khởi tạo được lịch AI");
      }
      return res.data ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
    },
  });
}

/** POST `/itineraries/{id}/ai-modify` — thay địa điểm không ưa bằng gợi ý AI. */
export function useAiModifyItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: {
      itineraryId: string;
      payload: any; // Allow partial payload from UI
    }) => {
      const res = await itineraryService.aiModifyItinerary({
        ...args.payload,
        itineraryId: args.itineraryId,
      });
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không điều chỉnh được lịch bằng AI");
      }
      return res.data ?? null;
    },
    onSuccess: async (data, { itineraryId }) => {
      // Xóa cache cũ để ép buộc fetch mới hoàn toàn
      queryClient.removeQueries({
        queryKey: ["itineraries", "detail", itineraryId],
      });
      queryClient.removeQueries({
        queryKey: ["itineraries", "detail", itineraryId, "items"],
      });

      // Gọi nạp lại dữ liệu
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["itineraries", "detail", itineraryId],
        }),
        queryClient.refetchQueries({
          queryKey: ["itineraries", "detail", itineraryId, "items"],
        }),
      ]);
      
      await queryClient.invalidateQueries({ queryKey: ["itineraries"] });

      const st = normalizeStatus(data?.status);
      if (st === ITINERARY_STATUS.PENDING || st === ITINERARY_STATUS.GENERATING) {
        showSuccessToast(
          "Đã gửi cho AI",
          "Lịch đang được cập nhật. Danh sách địa điểm sẽ tự làm mới khi xong."
        );
      } else {
        showSuccessToast("Đã cập nhật lịch trình");
      }
    },
    onError: (error) => {
      showErrorToast("Không điều chỉnh được lịch", error);
    },
  });
}

export function useUpdateItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itineraryId,
      payload,
    }: {
      itineraryId: string;
      payload: ItineraryRequest;
    }) => {
      const res = await itineraryService.updateItinerary(itineraryId, payload);
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data ?? {};
      }
      throw new Error(res?.message || "Không thể cập nhật lịch trình");
    },
    onSuccess: (_, { itineraryId }) => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      queryClient.invalidateQueries({
        queryKey: ["itineraries", "detail", itineraryId],
      });
      showSuccessToast("Cập nhật lịch trình thành công");
    },
  });
}

export function useConfirmItinerary() {
  const updateMutation = useUpdateItinerary();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itinerary: ItineraryResponse) => {
      if (!itinerary.id || !itinerary.group_id) {
        throw new Error("Missing itinerary id or group_id");
      }

      // Step 1: Lấy tất cả itineraries của nhóm
      const res = await itineraryService.getItinerariesByGroupId(itinerary.group_id);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được danh sách lịch trình");
      }

      const allItineraries = Array.isArray(res?.data) ? res.data : [];

      // Step 2: Tìm các itinerary đang CONFIRMED (ngoài itinerary hiện tại)
      const otherConfirmed = allItineraries.filter((it) => {
        if (it.id === itinerary.id) return false;
        const status = normalizeStatus(it.status);
        return status === ITINERARY_STATUS.CONFIRMED;
      });

      // Step 3: Set các itinerary đang CONFIRMED về DRAFT
      for (const other of otherConfirmed) {
        if (!other.id) continue;

        await itineraryService.updateItinerary(other.id, {
          name: other.title || "",
          description: other.description || "",
          start_date: tripPickerDateToItineraryDateTime(other.start_date, "start"),
          end_date: tripPickerDateToItineraryDateTime(other.end_date || other.start_date, "end"),
          people_quantity: other.people_quantity,
          budget_estimate: other.budget_estimate,
          themes: other.themes,
          group_id: other.group_id ?? undefined,
          status: ITINERARY_STATUS.DRAFT, // ← Set về DRAFT
        });
      }

      // Step 4: Confirm itinerary hiện tại
      const payload: ItineraryRequest = {
        name: itinerary.title || "",
        description: itinerary.description || "",
        start_date: tripPickerDateToItineraryDateTime(itinerary.start_date, "start"),
        end_date: tripPickerDateToItineraryDateTime(itinerary.end_date || itinerary.start_date, "end"),
        people_quantity: itinerary.people_quantity,
        budget_estimate: itinerary.budget_estimate,
        themes: itinerary.themes,
        group_id: itinerary.group_id ?? undefined,
        status: ITINERARY_STATUS.CONFIRMED, // ← Set CONFIRMED
      };

      return updateMutation.mutateAsync({
        itineraryId: itinerary.id,
        payload,
      });
    },
    onSuccess: async (_, variables) => {
      // Invalidate tất cả queries liên quan
      await queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      if (variables.group_id) {
        await queryClient.invalidateQueries({
          queryKey: ["itineraries", "group", variables.group_id],
        });
      }
      showSuccessToast("Đã áp dụng lịch trình chính thức!");
    },
    onError: (error: Error) => {
      showErrorToast("Áp dụng lịch trình thất bại", error);
    },
  });
}

export function useDeleteItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itineraryId: string) => {
      const res = await itineraryService.deleteItinerary(itineraryId);
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data;
      }
      throw new Error(res?.message || "Không thể xóa lịch trình");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itineraries"] });
      showSuccessToast("Xóa lịch trình thành công");
    },
  });
}

export function useAddTripItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itineraryId,
      payload,
    }: {
      itineraryId: string;
      payload: any;
    }) => {
      const res = await itineraryService.addTripItem(itineraryId, payload);
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data ?? {};
      }
      throw new Error(res?.message || "Không thể thêm địa điểm vào lịch");
    },
    onSuccess: (_, { itineraryId }) => {
      queryClient.invalidateQueries({
        queryKey: ["itineraries", "detail", itineraryId, "items"],
      });
      showSuccessToast("Đã thêm địa điểm");
    },
  });
}

export function useUpdateTripItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itineraryId,
      tripItemId,
      payload,
    }: {
      itineraryId: string;
      tripItemId: string;
      payload: any;
    }) => {
      const res = await itineraryService.updateTripItem(
        itineraryId,
        tripItemId,
        payload
      );
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data ?? {};
      }
      throw new Error(res?.message || "Không thể cập nhật địa điểm");
    },
    onSuccess: (_, { itineraryId }) => {
      queryClient.invalidateQueries({
        queryKey: ["itineraries", "detail", itineraryId, "items"],
      });
      showSuccessToast("Đã cập nhật địa điểm");
    },
  });
}

export function useDeleteTripItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itineraryId,
      tripItemId,
    }: {
      itineraryId: string;
      tripItemId: string;
    }) => {
      const res = await itineraryService.deleteTripItem(itineraryId, tripItemId);
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data;
      }
      throw new Error(res?.message || "Không thể xóa địa điểm");
    },
    onSuccess: (_, { itineraryId }) => {
      queryClient.invalidateQueries({
        queryKey: ["itineraries", "detail", itineraryId, "items"],
      });
      showSuccessToast("Đã xóa địa điểm");
    },
  });
}

/** Usecase 3: Gợi ý địa điểm thay thế bằng AI */
export function useAiSuggestLocation() {
  return useMutation({
    mutationFn: async (payload: { itineraryId: string; unwantedPlaceId: string }) => {
      const res = await itineraryService.suggestAlternativeLocation(payload);
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data ?? [];
      }
      throw new Error(res?.message || "Không thể lấy gợi ý địa điểm");
    },
  });
}

export function useFavoriteItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itineraryId: string) => {
      const res = await itineraryService.favoriteItinerary(itineraryId);
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data;
      }
      throw new Error(res?.message || "Không thể yêu thích lịch trình");
    },
    onSuccess: (_, itineraryId) => {
      queryClient.invalidateQueries({ queryKey: ["itineraries", "favorites"] });
      showSuccessToast("Đã lưu vào danh sách yêu thích");
    },
  });
}

export function useUnfavoriteItinerary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itineraryId: string) => {
      const res = await itineraryService.unfavoriteItinerary(itineraryId);
      const code = res?.code;
      if (code === 0 || code === 1000) {
        return res.data;
      }
      throw new Error(res?.message || "Không thể bỏ yêu thích lịch trình");
    },
    onSuccess: (_, itineraryId) => {
      queryClient.invalidateQueries({ queryKey: ["itineraries", "favorites"] });
      showSuccessToast("Đã bỏ khỏi danh sách yêu thích");
    },
  });
}

export { ITINERARY_STATUS };
