import AsyncStorage from "@react-native-async-storage/async-storage";

const ACCESS_TOKEN_KEY = "@tripjoy:accessToken";
const REFRESH_TOKEN_KEY = "@tripjoy:refreshToken";
const ONBOARDING_SEEN_KEY = "@tripjoy:onboardingSeen";
const GUEST_MODE_KEY = "@tripjoy:guestMode";

export const storage = {
  // Access Token
  async setAccessToken(token: string | null | undefined): Promise<void> {
    if (!token) {
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
      return;
    }
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  async getAccessToken(): Promise<string | null> {
    return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  },

  async removeAccessToken(): Promise<void> {
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  // Refresh Token
  async setRefreshToken(token: string | null | undefined): Promise<void> {
    if (!token) {
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
      return;
    }
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
  },

  async removeRefreshToken(): Promise<void> {
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  // Clear all tokens
  async clearTokens(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
    ]);
  },

  // Onboarding
  async setOnboardingSeen(seen: boolean): Promise<void> {
    if (seen) {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    } else {
      await AsyncStorage.removeItem(ONBOARDING_SEEN_KEY);
    }
  },

  async getOnboardingSeen(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
    return value === "true";
  },

  // Guest Mode
  async setGuestMode(isGuest: boolean): Promise<void> {
    if (isGuest) {
      await AsyncStorage.setItem(GUEST_MODE_KEY, "true");
    } else {
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
    }
  },

  async isGuestMode(): Promise<boolean> {
    const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
    return value === "true";
  },
};
