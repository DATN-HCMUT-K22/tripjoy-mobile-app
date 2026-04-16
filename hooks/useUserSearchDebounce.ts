import { searchService } from "@/services/search";
import { UserSimpleResponse } from "@/types/search";
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

/**
 * GET /users/search?q= — debounce 300ms, hủy request cũ khi gõ tiếp.
 */
export function useUserSearchDebounce(
  rawQuery: string,
  options: { enabled: boolean; debounceMs?: number }
) {
  const { enabled, debounceMs = DEBOUNCE_MS } = options;
  const [results, setResults] = useState<UserSimpleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      setResults([]);
      setIsLoading(false);
      return;
    }

    const trimmed = rawQuery.trim();
    if (!trimmed) {
      abortRef.current?.abort();
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIsLoading(true);

      try {
        const res = await searchService.searchUsers(trimmed, controller.signal);
        if (reqId !== requestIdRef.current) return;
        if (res.code === 1000 || res.code === 0) {
          setResults(res.data || []);
        } else {
          setResults([]);
        }
      } catch (e: unknown) {
        const err = e as { name?: string };
        if (err?.name === "AbortError") return;
        if (reqId === requestIdRef.current) {
          setResults([]);
        }
      } finally {
        if (reqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [rawQuery, enabled, debounceMs]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { results, isLoading };
}
