import type { LocationDto } from "@/services/locations";
import type { Location } from "@/types/trip";

/** Hiển thị WGS84 gọn trên UI (màn chọn điểm đi / điểm đến). */
export function formatLatLngForDisplay(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lon).toFixed(4)}°${ew}`;
}

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80",
  "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&q=80",
  "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80",
];

function hashIndex(id: string, len: number) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % len;
}

/**
 * Map API LocationDto (tỉnh/thành, địa điểm) sang Location dùng trong TripSetup / LocationItem.
 */
export function mapLocationDtoToTripLocation(dto: LocationDto): Location {
  const idx = hashIndex(dto.id || dto.name, PLACEHOLDER_IMAGES.length);
  const lat = dto.latitude ?? dto.lat;
  const lon = dto.longitude ?? dto.lng;
  const hasCoords =
    typeof lat === "number" &&
    typeof lon === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lon);
  const coordLine = hasCoords ? formatLatLngForDisplay(lat, lon) : null;

  const baseLabel =
    dto.address ||
    dto.full_address ||
    dto.place_formatted ||
    (coordLine ? "Tọa độ" : "") ||
    "";

  const subtitle =
    [baseLabel.trim(), coordLine].filter(Boolean).join(" · ") ||
    "Tỉnh / thành phố Việt Nam";

  return {
    id: dto.id,
    name: dto.name || (coordLine ? `Điểm ${coordLine}` : "Địa điểm"),
    subtitle,
    hashtag: "#KhámPháViệtNam",
    image: PLACEHOLDER_IMAGES[idx],
    rating: 0,
    priceRange: { min: 0, max: 0 },
    specialty: subtitle,
    ...(hasCoords ? { latitude: lat, longitude: lon } : {}),
  };
}
