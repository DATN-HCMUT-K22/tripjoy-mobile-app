import { Ionicons } from "@expo/vector-icons";

export const budgetOptions = [
  {
    id: "budget",
    title: "Rẻ",
    subtitle: "trải nghiệm vừa đủ cho chuyến đi",
    priceRange: "1.000.000 - 3.000.000 VNĐ/người",
    icon: "pricetag" as keyof typeof Ionicons.glyphMap,
    iconColor: "#F59E0B",
  },
  {
    id: "mid",
    title: "Cân bằng",
    subtitle: "Trải nghiệm cao cấp, xa xỉ",
    priceRange: "3.000.000 - 7.000.000 VNĐ/người",
    icon: "globe" as keyof typeof Ionicons.glyphMap,
    iconColor: "#3B82F6",
  },
  {
    id: "mid2",
    title: "Cân bằng",
    subtitle: "trải nghiệm vừa đủ cho chuyến đi",
    priceRange: "20.000.000 - 100.000.000+ VNĐ/người",
    icon: "earth" as keyof typeof Ionicons.glyphMap,
    iconColor: "#3B82F6",
  },
  {
    id: "flexible",
    title: "Linh hoạt",
    subtitle: "Không giới hạn ngân sách",
    priceRange: "20.000.000 - 100.000.000+ VNĐ/người",
    icon: "add-circle" as keyof typeof Ionicons.glyphMap,
    iconColor: "#34B27D",
  },
];
