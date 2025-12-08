export interface Group {
  id: string;
  name: string;
  description: string;
  image: string;
  initial: string;
  itineraryCount: number;
  memberCount: number;
  createdAt: string;
}

export interface Itinerary {
  id: string;
  groupId: string;
  name: string;
  image: string;
  startDate: string;
  endDate: string;
  duration: string;
  memberCount: number;
  budget: number;
}
