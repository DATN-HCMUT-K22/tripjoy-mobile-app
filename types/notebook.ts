export interface TravelNotebookResponse {
  id: string;
  name: string;
  description?: string;

  // AI-generated markdown content
  food?: string;              // Ẩm thực địa phương
  climate?: string;           // Khí hậu & trang phục
  culture?: string;           // Văn hóa, phong tục
  weather_forecast?: string;  // Dự báo thời tiết
  culture_etiquette?: string; // Phép lịch sự
  emergency_contacts?: string; // SĐT khẩn cấp
  packing_guide?: string;     // Danh sách đồ cần mang

  // Metadata
  itinerary?: {
    id: string;
    name: string;
  };
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface NotebookSection {
  key: string;
  title: string;
  icon: string;
  iconColor: string;
  content: string;
  defaultExpanded?: boolean;
}

export interface NotebookCacheData {
  data: TravelNotebookResponse;
  timestamp: number;
}

export interface FakeProgressStep {
  label: string;
  duration: number;
  progress: number; // 0-95
}
