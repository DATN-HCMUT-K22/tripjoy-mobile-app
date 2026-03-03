import { Ionicons } from "@expo/vector-icons";

export const budgetOptions = [
  {
    id: "flexible",
    title: "Linh hoạt",
    subtitle: "Không giới hạn ngân sách",
    priceRange: "20.000.000 - 100.000.000+ VNĐ/người",
    icon: "diamond" as keyof typeof Ionicons.glyphMap,
    iconColor: "#34B27D",
  },
  {
    id: "budget",
    title: "Tiết kiệm",
    subtitle: "Tối ưu chi phí",
    priceRange: "5.000.000 - 10.000.000 VNĐ/người",
    icon: "wallet" as keyof typeof Ionicons.glyphMap,
    iconColor: "#F59E0B",
  },
  {
    id: "mid",
    title: "Trung bình",
    subtitle: "Cân bằng chất lượng và giá",
    priceRange: "10.000.000 - 20.000.000 VNĐ/người",
    icon: "cash" as keyof typeof Ionicons.glyphMap,
    iconColor: "#3B82F6",
  },
  {
    id: "luxury",
    title: "Cao cấp",
    subtitle: "Trải nghiệm sang trọng",
    priceRange: "50.000.000 - 200.000.000+ VNĐ/người",
    icon: "trophy" as keyof typeof Ionicons.glyphMap,
    iconColor: "#8B5CF6",
  },
];
