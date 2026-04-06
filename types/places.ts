/** Snapshot địa điểm từ Google Places (không có trong mockAttractions). */
export interface ExternalPlaceSnapshot {
  name: string;
  subtitle: string;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  types?: string[];
}
