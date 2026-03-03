import { storage } from "@/utils/storage";
import { useEffect, useState } from "react";

export function useAuth() {
  const [hasToken, setHasToken] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      setIsChecking(true);
      const token = await storage.getAccessToken();
      setHasToken(!!token);
    } catch (error) {
      setHasToken(false);
    } finally {
      setIsChecking(false);
    }
  };

  return {
    hasToken,
    isChecking,
    checkToken,
  };
}

