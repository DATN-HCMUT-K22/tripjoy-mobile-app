import { storage } from "@/utils/storage";
import { useEffect, useState } from "react";

/**
 * Hook để kiểm tra xem user có đang ở chế độ guest không
 */
export function useGuestMode() {
  const [isGuest, setIsGuest] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkGuestMode();
  }, []);

  const checkGuestMode = async () => {
    try {
      const guestMode = await storage.isGuestMode();
      setIsGuest(guestMode);
    } catch (error) {
      setIsGuest(false);
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isGuest,
    isChecking,
    checkGuestMode,
  };
}
