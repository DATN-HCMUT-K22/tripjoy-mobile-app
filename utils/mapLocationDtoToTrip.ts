import type { LocationDto, LocationSearchHitDto } from "@/services/locations";
import type { Location } from "@/types/trip";
import type { ExternalPlaceSnapshot } from "@/types/places";
import { buildStaticMapImageUrl } from "@/utils/staticMapUrl";

/** Hiển thị WGS84 gọn trên UI (màn chọn điểm đi / điểm đến). */
export function formatLatLngForDisplay(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lon).toFixed(4)}°${ew}`;
}

/** Chỉ dùng khi DTO không có tọa độ — tránh gán ảnh stock không khớp tên tỉnh. */
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80";

/**
 * Map API LocationDto (tỉnh/thành, địa điểm) sang Location dùng trong TripSetup / LocationItem.
 */
export function mapLocationDtoToTripLocation(dto: LocationDto): Location {
  const lat = dto.latitude ?? dto.lat;
  const lon = dto.longitude ?? dto.lng;
  const latNum = Number(lat);
  const lonNum = Number(lon);
  const hasCoords =
    lat != null &&
    lon != null &&
    !Number.isNaN(latNum) &&
    !Number.isNaN(lonNum);
  const coordLine = hasCoords ? formatLatLngForDisplay(latNum, lonNum) : null;

  const baseLabel =
    dto.address ||
    dto.full_address ||
    dto.place_formatted ||
    dto.name_en ||
    "";

  // Lấy và dịch loại địa chính (location_type)
  const locType = dto.location_type?.toUpperCase() || "";
  const typeMap: Record<string, string> = {
    PROVINCE: "Tỉnh",
    CITY: "Thành phố",
    COUNTRY: "Quốc gia",
    DISTRICT: "Quận / Huyện",
    WARD: "Phường / Xã",
    REGION: "Khu vực / Vùng",
    TOURIST_ATTRACTION: "Điểm tham quan",
    MUSEUM: "Bảo tàng",
    PARK: "Công viên",
    LANDMARK: "Địa danh",
  };
  const typeText = locType ? (typeMap[locType] || dto.location_type) : "";

  // Hiển thị độ phổ biến nếu Backend trả về usage_count > 0
  const usageText = 
    dto.usage_count && dto.usage_count > 0 
      ? `🔥 ${dto.usage_count.toLocaleString("vi-VN")} chuyến đi`
      : "";

  const subtitle =
    [typeText, usageText, baseLabel.trim()].filter(Boolean).join(" · ") || "Địa danh Việt Nam";

  /** Ảnh preview khớp địa lý: bản đồ tĩnh tại tâm tỉnh (không dùng ảnh stock xoay vòng — dễ lệch cảnh như Hạ Long). */
  const image = hasCoords
    ? buildStaticMapImageUrl(
        [{ latitude: latNum, longitude: lonNum }],
        { width: 800, height: 512, zoom: 10 }
      )
    : FALLBACK_IMAGE;

  return {
    id: dto.id,
    name: dto.name || (coordLine ? `Điểm ${coordLine}` : "Địa điểm"),
    ...(dto.name_en ? { nameEn: dto.name_en } : {}),
    subtitle,
    hashtag: "#KhámPháViệtNam",
    image,
    rating: 0,
    priceRange: { min: 0, max: 0 },
    specialty: subtitle,
    ...(hasCoords ? { latitude: latNum, longitude: lonNum } : {}),
    provider: (dto as any).provider || "GOOGLE_MAPS",
    provider_id: dto.provider_id,
  };
}

/** POI Tier 2 từ GET /locations/search|nearby → snapshot lịch trình. */
export function locationSearchHitToExternalSnapshot(
  hit: LocationSearchHitDto
): ExternalPlaceSnapshot {
  const lat = hit.latitude;
  const lng = hit.longitude;
  const addr =
    hit.fullAddress?.trim() ||
    hit.full_address?.trim() ||
    "";
  const types = (hit.poiCategories ?? hit.poi_categories ?? []).filter(
    (t): t is string => typeof t === "string"
  );
  const latNum = lat != null ? Number(lat) : NaN;
  const lngNum = lng != null ? Number(lng) : NaN;
  const imageUrl =
    !Number.isNaN(latNum) &&
    !Number.isNaN(lngNum)
      ? buildStaticMapImageUrl(
          [{ latitude: latNum, longitude: lngNum }],
          { width: 400, height: 400, zoom: 16 }
        )
      : "";
  return {
    name: hit.name,
    subtitle: addr || "Địa điểm",
    imageUrl,
    latitude: !Number.isNaN(latNum) ? latNum : undefined,
    longitude: !Number.isNaN(lngNum) ? lngNum : undefined,
    types: types.length ? types : ["point_of_interest"],
  };
}
