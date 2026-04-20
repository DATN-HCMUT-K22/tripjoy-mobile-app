import { TripItemResponse } from '@/services/itineraries';

export interface ItineraryItem {
  id: string;
  locationId: string;
  name: string;
  image: string;
  timeRange: {
    start: string; // "08:00"
    end: string; // "09:00"
  };
  price: string; // "70.000 VND" hoặc "0 VND" hoặc "80.000 - 120.000 VND"
  googleMapsUrl?: string;
  category: "restaurant" | "attraction" | "hotel" | "activity";
  transportation: {
    car?: string; // "10 phút" hoặc "-"
    motorcycle?: string;
    bus?: string;
    walking?: string;
    bicycle?: string;
    airplane?: string;
  };
  timelineIcon?: "restaurant" | "location" | "telescope" | "bed";
}

// Filter and Sort types
export type ItineraryFilter = {
  status?: string[];
  dateRange?: { start: string; end: string };
  themes?: string[];
  groupId?: string;
  searchQuery?: string;
};

export type ItinerarySortBy =
  | 'created_at'
  | 'start_date'
  | 'name'
  | 'budget_estimate';

export type ItinerarySortOrder = 'asc' | 'desc';

export type ItinerarySort = {
  by: ItinerarySortBy;
  order: ItinerarySortOrder;
};

// Timeline grouping
export type TimelineDay = {
  dayKey: string; // "2024-03-20"
  dayLabel: string; // "Ngày 1 - 20/03"
  items: TripItemResponse[];
};

// UI state types
export type ItineraryListViewMode = 'grid' | 'list';
export type ItineraryTab = 'ongoing' | 'completed' | 'draft';

// Tab definition
export type ItineraryTabItem = {
  key: ItineraryTab;
  label: string;
  count: number;
};
