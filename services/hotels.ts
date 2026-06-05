/**
 * Hotel service for Booking.com API integration
 */

export interface HotelSearchResult {
  id: string;
  name: string;
  image_url: string;
  label: string;
  [key: string]: any;
}

export interface HotelsSearchResponse {
  data: HotelSearchResult[];
}

const BOOKING_API_BASE = "https://booking-com15.p.rapidapi.com/api/v1/hotels";
const RAPIDAPI_HOST = "booking-com15.p.rapidapi.com";
const RAPIDAPI_KEY = "e30d2fe3e9mshe5808addc1184eep105a44jsn9c339acf91a7";

export const hotelsService = {
  /**
   * Search for hotels by destination query
   * @param query - Hotel search query (e.g., "Hà Nội", "TP. Hồ Chí Minh", "man")
   * @returns Promise with hotel search results
   */
  async searchDestination(query: string = "man"): Promise<HotelSearchResult[]> {
    try {
      const response = await fetch(
        `${BOOKING_API_BASE}/searchDestination?query=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data: HotelsSearchResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("[HotelsService] Search failed:", error);
      throw error;
    }
  },
};
