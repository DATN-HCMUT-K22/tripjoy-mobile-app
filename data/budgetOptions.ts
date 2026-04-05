import { Ionicons } from "@expo/vector-icons";

/** Ngân sách nhập tay — lưu kèm budgetMinVnd / budgetMaxVnd trong context */
export const BUDGET_CUSTOM_ID = "custom";

/** Giới hạn nhập tay (VNĐ / người) */
export const BUDGET_MANUAL_MAX_PER_PERSON_VND = 500_000_000;

export type BudgetOption = {
  id: string;
  title: string;
  subtitle: string;
  priceRange: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  /** Nền khi đã chọn — đồng bộ với thẻ loại hình */
  gradient: [string, string];
};

/** Thứ tự: ít tiền → nhiều tiền (theo khoảng gợi ý) */
export const budgetOptions: BudgetOption[] = [
  {
    id: "budget",
    title: "Tiết kiệm",
    subtitle: "Tối ưu chi phí",
    priceRange: "5–10 triệu/người",
    icon: "wallet",
    iconColor: "#D97706",
    gradient: ["#FFFBEB", "#FDE68A"],
  },
  {
    id: "mid",
    title: "Trung bình",
    subtitle: "Cân bằng chất lượng và giá",
    priceRange: "10–20 triệu/người",
    icon: "cash",
    iconColor: "#2563EB",
    gradient: ["#EFF6FF", "#BFDBFE"],
  },
  {
    id: "flexible",
    title: "Linh hoạt",
    subtitle: "Không giới hạn ngân sách",
    priceRange: "20–100+ triệu/người",
    icon: "diamond",
    iconColor: "#34B27D",
    gradient: ["#ECFDF5", "#A7F3D0"],
  },
  {
    id: "luxury",
    title: "Cao cấp",
    subtitle: "Trải nghiệm sang trọng",
    priceRange: "50–200+ triệu/người",
    icon: "trophy",
    iconColor: "#7C3AED",
    gradient: ["#F5F3FF", "#DDD6FE"],
  },
];
