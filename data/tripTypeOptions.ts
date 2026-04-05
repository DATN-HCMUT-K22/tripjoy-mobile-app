import { Ionicons } from "@expo/vector-icons";

type IonGlyph = keyof typeof Ionicons.glyphMap;

export type TripTypeOption = {
  id: string;
  name: string;
  icon: string;
  ionIcon: IonGlyph;
  /** Màu accent (icon / viền khi chọn) */
  accent: string;
  /** Gradient cho nền chip (sinh động) */
  gradient: [string, string];
};

export const tripTypeOptions: TripTypeOption[] = [
  {
    id: "beach",
    name: "Tắm biển",
    icon: "🏝️",
    ionIcon: "sunny-outline",
    accent: "#0EA5E9",
    gradient: ["#E0F2FE", "#BAE6FD"],
  },
  {
    id: "resort",
    name: "Nghỉ dưỡng",
    icon: "⛰️",
    ionIcon: "bed-outline",
    accent: "#8B5CF6",
    gradient: ["#EDE9FE", "#DDD6FE"],
  },
  {
    id: "adventure",
    name: "Phiêu lưu",
    icon: "🏔️",
    ionIcon: "flash-outline",
    accent: "#EA580C",
    gradient: ["#FFEDD5", "#FED7AA"],
  },
  {
    id: "culture",
    name: "Văn hóa",
    icon: "🏛️",
    ionIcon: "library-outline",
    accent: "#CA8A04",
    gradient: ["#FEF9C3", "#FEF08A"],
  },
  {
    id: "food",
    name: "Ẩm thực",
    icon: "🍜",
    ionIcon: "restaurant-outline",
    accent: "#DC2626",
    gradient: ["#FEE2E2", "#FECACA"],
  },
  {
    id: "nature",
    name: "Thiên nhiên",
    icon: "🌲",
    ionIcon: "leaf-outline",
    accent: "#16A34A",
    gradient: ["#DCFCE7", "#BBF7D0"],
  },
  {
    id: "family",
    name: "Gia đình",
    icon: "👨‍👩‍👧",
    ionIcon: "people-outline",
    accent: "#DB2777",
    gradient: ["#FCE7F3", "#FBCFE8"],
  },
  {
    id: "honeymoon",
    name: "Tuần trăng mật",
    icon: "💕",
    ionIcon: "heart-outline",
    accent: "#E11D48",
    gradient: ["#FFE4E6", "#FECDD3"],
  },
  {
    id: "diving",
    name: "Lặn biển",
    icon: "🤿",
    ionIcon: "water-outline",
    accent: "#0891B2",
    gradient: ["#CFFAFE", "#A5F3FC"],
  },
  {
    id: "cruise",
    name: "Du thuyền",
    icon: "🛳️",
    ionIcon: "boat-outline",
    accent: "#0369A1",
    gradient: ["#DBEAFE", "#BFDBFE"],
  },
  {
    id: "shopping",
    name: "Mua sắm",
    icon: "🛍️",
    ionIcon: "bag-handle-outline",
    accent: "#C026D3",
    gradient: ["#FAE8FF", "#F0ABFC"],
  },
  {
    id: "photography",
    name: "Chụp ảnh",
    icon: "📷",
    ionIcon: "camera-outline",
    accent: "#4F46E5",
    gradient: ["#EEF2FF", "#E0E7FF"],
  },
  {
    id: "wellness",
    name: "Spa & thư giãn",
    icon: "🧘",
    ionIcon: "sparkles-outline",
    accent: "#0D9488",
    gradient: ["#CCFBF1", "#99F6E4"],
  },
  {
    id: "nightlife",
    name: "Vui đêm",
    icon: "🌃",
    ionIcon: "musical-notes-outline",
    accent: "#6D28D9",
    gradient: ["#EDE9FE", "#DDD6FE"],
  },
  {
    id: "eco",
    name: "Sinh thái",
    icon: "♻️",
    ionIcon: "earth-outline",
    accent: "#166534",
    gradient: ["#DCFCE7", "#86EFAC"],
  },
  {
    id: "trekking",
    name: "Trekking",
    icon: "🥾",
    ionIcon: "footsteps-outline",
    accent: "#B45309",
    gradient: ["#FFFBEB", "#FDE68A"],
  },
  {
    id: "business",
    name: "Công tác",
    icon: "💼",
    ionIcon: "briefcase-outline",
    accent: "#475569",
    gradient: ["#F1F5F9", "#E2E8F0"],
  },
  {
    id: "solo",
    name: "Đi một mình",
    icon: "🧳",
    ionIcon: "person-outline",
    accent: "#78716C",
    gradient: ["#F5F5F4", "#E7E5E4"],
  },
  {
    id: "spiritual",
    name: "Tâm linh",
    icon: "🙏",
    ionIcon: "rose-outline",
    accent: "#B45309",
    gradient: ["#FFF7ED", "#FFEDD5"],
  },
  {
    id: "sport",
    name: "Thể thao",
    icon: "⚽",
    ionIcon: "football-outline",
    accent: "#2563EB",
    gradient: ["#DBEAFE", "#BFDBFE"],
  },
  {
    id: "festival",
    name: "Lễ hội",
    icon: "🎉",
    ionIcon: "balloon-outline",
    accent: "#D97706",
    gradient: ["#FEF3C7", "#FDE68A"],
  },
];
