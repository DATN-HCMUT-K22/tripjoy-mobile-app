import { EXPO_PUBLIC_MOCK_DATA } from "@/config/env";
import { mockItineraries } from "@/data/mockItineraries";
import {
  itineraryService,
  ItineraryRequest,
  ItineraryResponse,
  GenerateItineraryRequest,
  ITINERARY_STATUS,
} from "@/services/itineraries";
import type { Itinerary as DisplayItinerary } from "@/types/group";
import { parseItineraryDateToDayOnly } from "@/utils/itineraryDates";
import { timeAgo } from "@/utils/format";
import { showSuccessToast } from "@/utils/toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
  if (!Number.isNaN(start.getTime()) && start > today) return "draft";
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

  if (s === ITINERARY_STATUS.GENERATING || s === ITINERARY_STATUS.FAILED) {
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
export function useItineraries() {
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
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map(mapApiItineraryToDisplay);
    },
    staleTime: 60 * 1000,
  });
}

/** GET `/itineraries/favorites` */
export function useFavoriteItineraries() {
  return useQuery({
    queryKey: ["itineraries", "favorites"],
    queryFn: async (): Promise<DisplayItinerary[]> => {
      if (EXPO_PUBLIC_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 200));
        return [];
      }
      const res = await itineraryService.getFavoriteItineraries();
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được lịch yêu thích");
      }
      const list = Array.isArray(res?.data) ? res.data : [];
      return list.map(mapApiItineraryToDisplay);
    },
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
      const res = await itineraryService.getItineraryById(itineraryId);
      const code = res?.code;
      if (code !== 0 && code !== 1000) {
        throw new Error(res?.message || "Không tải được lịch trình");
      }
      return res.data ?? null;
    },
    enabled,
    staleTime: 30 * 1000,
    refetchInterval: (q) => {
      const d = q.state.data;
      return poll && d?.status === ITINERARY_STATUS.GENERATING ? 2500 : false;
    },
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
      const list = Array.isArray(res?.data) ? res.data : [];
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

/** POST `/itineraries/generate` (202) — sau đó dùng `useItineraryDetail(id)` để poll. */
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

export { ITINERARY_STATUS };
