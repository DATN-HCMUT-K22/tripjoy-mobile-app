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
