import type { Location } from "@/types/trip";

/**
 * 5 tỉnh/thành mẫu cho màn tạo lịch trình (điểm đi / điểm đến).
 * Tọa độ WGS84 = tâm hành chính thành phố trực thuộc / tỉnh lị (độ chính xác bản đồ số thông dụng, không lấy từ Google Places API).
 * Tham chiếu: mốc địa lý công bố rộng rãi (OSM/Wikipedia infobox — trung tâm TP).
 */
export const sampleProvinceLocations: Location[] = [
  {
    id: "sample-hn",
    name: "Hà Nội",
    subtitle: "Thủ đô — 21.0285°N, 105.8542°E",
    hashtag: "#HàNội",
    image: "https://images.unsplash.com/photo-1599708153386-00641df9d42e?w=400&q=80",
    rating: 0,
    priceRange: { min: 0, max: 0 },
    specialty: "Trung tâm hành chính Hà Nội",
    latitude: 21.0285,
    longitude: 105.8542,
  },
  {
    id: "sample-hcm",
    name: "TP. Hồ Chí Minh",
    subtitle: "Trung tâm Q.1 — 10.7769°N, 106.7009°E",
    hashtag: "#TPHCM",
    image: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80",
    rating: 0,
    priceRange: { min: 0, max: 0 },
    specialty: "Khu vực trung tâm TP. Hồ Chí Minh",
    latitude: 10.7769,
    longitude: 106.7009,
  },
  {
    id: "sample-dng",
    name: "Đà Nẵng",
    subtitle: "Trung tâm thành phố — 16.0544°N, 108.2022°E",
    hashtag: "#ĐàNẵng",
    image: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&q=80",
    rating: 0,
    priceRange: { min: 0, max: 0 },
    specialty: "Trung tâm thành phố Đà Nẵng",
    latitude: 16.0544,
    longitude: 108.2022,
  },
  {
    id: "sample-ct",
    name: "Cần Thơ",
    subtitle: "Trung tâm TP Cần Thơ — 10.0452°N, 105.7469°E",
    hashtag: "#CầnThơ",
    image: "https://images.unsplash.com/photo-1596422847844-309f7bf78dc9?w=400&q=80",
    rating: 0,
    priceRange: { min: 0, max: 0 },
    specialty: "Trung tâm thành phố Cần Thơ",
    latitude: 10.0452,
    longitude: 105.7469,
  },
  {
    id: "sample-hp",
    name: "Hải Phòng",
    subtitle: "Trung tâm thành phố — 20.8449°N, 106.6881°E",
    hashtag: "#HảiPhòng",
    image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80",
    rating: 0,
    priceRange: { min: 0, max: 0 },
    specialty: "Trung tâm thành phố Hải Phòng",
    latitude: 20.8449,
    longitude: 106.6881,
  },
];
