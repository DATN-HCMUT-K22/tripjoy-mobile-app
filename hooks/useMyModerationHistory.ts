import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyModerationHistory } from "@/services/users";
import { ModerationActionResponse } from "@/types/moderation";

export function useMyModerationHistory(size: number = 20) {
  const [page, setPage] = useState(0);
  const [moderations, setModerations] = useState<ModerationActionResponse[]>([]);

  const query = useQuery({
    queryKey: ["myModerationHistory", page, size],
    queryFn: async () => {
      const res = await getMyModerationHistory(page, size);
      if (res.code === 1000 || res.code === 0) {
        return res.data;
      }
      throw new Error(res.message || "Failed to fetch moderation history");
    },
  });

  useEffect(() => {
    if (query.data?.content) {
      if (page === 0) {
        setModerations(query.data.content);
      } else {
        setModerations((prev) => {
          // Avoid duplicates by checking IDs
          const newItems = query.data.content.filter(
            (item) => !prev.some((p) => p.id === item.id)
          );
          return [...prev, ...newItems];
        });
      }
    }
  }, [query.data, page]);

  const loadMore = () => {
    if (query.data && page < query.data.totalPages - 1) {
      setPage((prev) => prev + 1);
    }
  };

  const hasNextPage = query.data ? page < query.data.totalPages - 1 : false;

  return {
    data: moderations,
    isLoading: query.isLoading && page === 0,
    isFetching: query.isFetching,
    loadMore,
    hasNextPage,
    refetch: () => {
      setPage(0);
      query.refetch();
    }
  };
}
