export interface Location {
  id: string;
  name: string;
  subtitle: string;
  hashtag: string;
  image: string;
  rating: number;
  priceRange: {
    min: number;
    max: number;
  };
  specialty: string;
  isSelected?: boolean;
}

export interface TripSetup {
  location?: Location;
  dateRange?: {
    from: string;
    to: string;
  };
  budget?: {
    type: "flexible" | "fixed";
    min: number;
    max: number;
  };
  tripType?: string[];
}
