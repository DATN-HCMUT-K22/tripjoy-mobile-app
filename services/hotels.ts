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
      console.log(`[HotelsService] Step 1: Searching destination with query: "${query}"`);
      const destUrl = `${BOOKING_API_BASE}/searchDestination?query=${encodeURIComponent(query)}`;
      const destResponse = await fetch(destUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      });

      if (!destResponse.ok) {
        console.error(`[HotelsService] Destination API request failed with status ${destResponse.status}`);
        throw new Error(`API request failed with status ${destResponse.status}`);
      }

      const destData = await destResponse.json();
      const locations = destData.data || [];
      
      if (locations.length === 0) {
        console.log(`[HotelsService] No destinations found for query: "${query}"`);
        return [];
      }

      // Lấy địa điểm đầu tiên (thường là kết quả chính xác nhất như city)
      const primaryLocation = locations[0];
      const destId = primaryLocation.dest_id;
      const searchType = primaryLocation.search_type;

      console.log(`[HotelsService] Step 2: Found destination ${primaryLocation.name} (ID: ${destId}, Type: ${searchType}). Searching hotels...`);

      // Khởi tạo ngày check-in (ngày mai) và check-out (ngày mốt)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

      const arrivalDate = tomorrow.toISOString().split('T')[0];
      const departureDate = dayAfterTomorrow.toISOString().split('T')[0];

      const hotelsUrl = `${BOOKING_API_BASE}/searchHotels?dest_id=${destId}&search_type=${searchType}&arrival_date=${arrivalDate}&departure_date=${departureDate}&adults=2&room_qty=1&page_number=1`;
      
      const hotelsResponse = await fetch(hotelsUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY,
        },
      });

      if (!hotelsResponse.ok) {
        console.error(`[HotelsService] Hotels API request failed with status ${hotelsResponse.status}`);
        throw new Error(`Hotels API request failed with status ${hotelsResponse.status}`);
      }

      const hotelsData = await hotelsResponse.json();
      const rawHotels = hotelsData.data?.hotels || [];

      // Map to HotelSearchResult
      const mappedHotels: HotelSearchResult[] = rawHotels.map((item: any) => {
        const prop = item.property || {};
        const price = prop.priceBreakdown?.grossPrice?.value;
        const currency = prop.priceBreakdown?.grossPrice?.currency || 'USD';
        const priceStr = price ? `${Math.round(price)} ${currency}` : '';
        const rating = prop.reviewScore ? `⭐ ${prop.reviewScore}` : '';
        const classStars = prop.propertyClass ? `${prop.propertyClass} Sao` : '';
        
        const labelParts = [rating, classStars, priceStr].filter(Boolean);

        return {
          id: item.hotel_id?.toString() || prop.id?.toString() || Math.random().toString(),
          name: prop.name || item.accessibilityLabel?.split('.')[0] || "Unknown Hotel",
          image_url: prop.photoUrls?.[0] || 'https://via.placeholder.com/150',
          label: labelParts.join(' • ') || 'Khách sạn',
        };
      });

      console.log(`[HotelsService] Search completed. Found ${mappedHotels.length} actual hotels.`);
      return mappedHotels;
    } catch (error) {
      console.error("[HotelsService] Search failed:", error);
      throw error;
    }
  },
};
