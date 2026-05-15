/** Snapshot POI Tier 2 (TripJoy location id hoặc tạm từ Google trước resolve). */
export interface ExternalPlaceSnapshot {
  providerId?: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  latitude?: number;
  longitude?: number;
  types?: string[];
}
