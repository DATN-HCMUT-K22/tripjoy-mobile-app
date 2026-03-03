import { Group, GroupMember } from "@/types/group";
import { mockContacts } from "./mockContacts";

// Helper function để tạo members từ mockContacts
const createMembers = (
  groupId: string,
  count: number,
  startIndex: number = 0
): GroupMember[] => {
  return Array.from({ length: count }, (_, i) => {
    const contactIndex = (startIndex + i) % mockContacts.length;
    const contact = mockContacts[contactIndex];
    return {
      id: `${groupId}-member-${i + 1}`,
      user: {
        id: contact.id,
        username: contact.email.split("@")[0],
        fullName: contact.name,
        avatarUrl: contact.avatar,
      },
      role: i === 0 ? "LEADER" : "MEMBER",
      created_at: "2025-01-01T00:00:00Z",
      created_by: "user1",
      updated_at: "2025-01-01T00:00:00Z",
      updated_by: "user1",
    };
  });
};

export const mockGroups: (Group & {
  lastMessage?: string;
  unreadCount?: number;
  image?: string;
  initial?: string;
  itineraryCount?: number;
  memberCount?: number;
  createdAt?: string;
})[] = [
  {
    id: "1",
    name: "Nhóm du lịch Nha Trang - Khánh Hòa",
    description: "Khám phá biển xanh cát trắng Nha Trang",
    image:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    avatar:
      "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    initial: "N",
    itineraryCount: 2, // Từ mockItineraries: groupId "1" có 2 itineraries - Nha Trang beach
    memberCount: 12,
    members: createMembers("1", 12, 0),
    createdAt: "2025-01-01",
    created_at: "2025-01-01T00:00:00Z",
    created_by: "user1",
    updated_at: "2025-01-01T00:00:00Z",
    updated_by: "user1",
    isDeleted: false,
    theme: null,
    theme_color: "#34B27D",
    is_pro: true,
    chatbot_count: 2,
    lastMessage: "Mai: Mọi người chuẩn bị đồ bơi nhé!",
    unreadCount: 5,
  },
  {
    id: "2",
    name: "Hành trình Sapa - Lào Cai",
    description: "Ngắm ruộng bậc thang vàng mùa lúa chín",
    image:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    avatar:
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=80",
    initial: "S",
    itineraryCount: 0, // Chưa có itinerary trong mockItineraries - Sapa terraced fields
    memberCount: 8,
    members: createMembers("2", 8, 2),
    createdAt: "2025-01-02",
    created_at: "2025-01-02T00:00:00Z",
    created_by: "user2",
    updated_at: "2025-01-02T00:00:00Z",
    updated_by: "user2",
    isDeleted: false,
    theme: null,
    theme_color: "#FF6B6B",
    is_pro: false,
    chatbot_count: 1,
    lastMessage: "Lan: Thời tiết Sapa đẹp quá!",
    unreadCount: 2,
  },
  {
    id: "3",
    name: "Đà Lạt - Thành phố ngàn hoa",
    description: "Du lịch Đà Lạt mùa hoa dã quỳ nở rộ",
    image:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
    avatar:
      "https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80",
    initial: "Đ",
    itineraryCount: 2, // Từ mockItineraries: groupId "3" có 2 itineraries - Da Lat flowers
    memberCount: 15,
    members: createMembers("3", 15, 4),
    createdAt: "2025-01-03",
    created_at: "2025-01-03T00:00:00Z",
    created_by: "user3",
    updated_at: "2025-01-03T00:00:00Z",
    updated_by: "user3",
    isDeleted: false,
    theme: null,
    theme_color: "#4ECDC4",
    is_pro: true,
    chatbot_count: 3,
    lastMessage: "Hùng: Check-in đồi chè Cầu Đất",
    unreadCount: 0,
  },
  {
    id: "4",
    name: "Phú Quốc - Thiên đường biển đảo",
    description: "Nghỉ dưỡng tại đảo ngọc Phú Quốc",
    image:
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80",
    avatar:
      "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&q=80",
    initial: "P",
    itineraryCount: 3, // Từ mockItineraries: groupId "4" có 3 itineraries - Phu Quoc island
    memberCount: 6,
    members: createMembers("4", 6, 6),
    createdAt: "2025-01-04",
    created_at: "2025-01-04T00:00:00Z",
    created_by: "user4",
    updated_at: "2025-01-04T00:00:00Z",
    updated_by: "user4",
    isDeleted: false,
    theme: null,
    theme_color: "#95E1D3",
    is_pro: false,
    chatbot_count: 1,
    lastMessage: "Hoa: Resort view đẹp quá!",
    unreadCount: 1,
  },
  {
    id: "5",
    name: "Hạ Long - Vịnh di sản",
    description: "Du thuyền khám phá vịnh Hạ Long",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    avatar:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    initial: "H",
    itineraryCount: 1, // Từ mockItineraries: groupId "5" có 1 itinerary - Ha Long Bay
    memberCount: 10,
    members: createMembers("5", 10, 0),
    createdAt: "2025-01-05",
    created_at: "2025-01-05T00:00:00Z",
    created_by: "user5",
    updated_at: "2025-01-05T00:00:00Z",
    updated_by: "user5",
    isDeleted: false,
    theme: null,
    theme_color: "#F38181",
    is_pro: true,
    chatbot_count: 2,
    lastMessage: "Nam: Đặt tour hang Sửng Sốt",
    unreadCount: 3,
  },
  {
    id: "6",
    name: "Hội An - Phố cổ đèn lồng",
    description: "Trải nghiệm văn hóa phố cổ Hội An",
    image:
      "https://source.unsplash.com/800x600/?hoi-an,vietnam,ancient-town,lanterns",
    avatar:
      "https://source.unsplash.com/800x600/?hoi-an,vietnam,ancient-town,lanterns",
    initial: "H",
    itineraryCount: 4, // Từ mockItineraries: groupId "6" có 4 itineraries - Hoi An ancient town
    memberCount: 18,
    members: createMembers("6", 18, 2),
    createdAt: "2025-01-06",
    created_at: "2025-01-06T00:00:00Z",
    created_by: "user6",
    updated_at: "2025-01-06T00:00:00Z",
    updated_by: "user6",
    isDeleted: false,
    theme: null,
    theme_color: "#AA96DA",
    is_pro: true,
    chatbot_count: 4,
    lastMessage: "Vy: Đêm phố cổ đẹp quá!",
    unreadCount: 7,
  },
  {
    id: "7",
    name: "Mai Châu - Văn hóa dân tộc Thái",
    description: "Homestay và trải nghiệm văn hóa dân tộc",
    image:
      "https://source.unsplash.com/800x600/?mai-chau,vietnam,village,rice-fields",
    avatar:
      "https://source.unsplash.com/800x600/?mai-chau,vietnam,village,rice-fields",
    initial: "M",
    itineraryCount: 2, // Từ mockItineraries: groupId "7" có 2 itineraries - Mai Chau village
    memberCount: 5,
    members: createMembers("7", 5, 4),
    createdAt: "2025-01-07",
    created_at: "2025-01-07T00:00:00Z",
    created_by: "user7",
    updated_at: "2025-01-07T00:00:00Z",
    updated_by: "user7",
    isDeleted: false,
    theme: null,
    theme_color: "#FCBAD3",
    is_pro: false,
    chatbot_count: 0,
    lastMessage: "Dũng: Xem múa xòe tối nay",
    unreadCount: 0,
  },
  {
    id: "8",
    name: "Cần Thơ - Miền Tây sông nước",
    description: "Khám phá chợ nổi và văn hóa miền Tây",
    image:
      "https://source.unsplash.com/800x600/?can-tho,vietnam,floating-market,mekong",
    avatar:
      "https://source.unsplash.com/800x600/?can-tho,vietnam,floating-market,mekong",
    initial: "C",
    itineraryCount: 1, // Từ mockItineraries: groupId "8" có 1 itinerary - Can Tho floating market
    memberCount: 9,
    members: createMembers("8", 9, 6),
    createdAt: "2025-01-08",
    created_at: "2025-01-08T00:00:00Z",
    created_by: "user8",
    updated_at: "2025-01-08T00:00:00Z",
    updated_by: "user8",
    isDeleted: false,
    theme: null,
    theme_color: "#FFD93D",
    is_pro: false,
    chatbot_count: 1,
    lastMessage: "Thảo: Ăn bún riêu chợ nổi",
    unreadCount: 4,
  },
  {
    id: "9",
    name: "Mũi Né - Bình Thuận",
    description: "Trượt cát và ngắm hoàng hôn",
    image:
      "https://source.unsplash.com/800x600/?mui-ne,vietnam,sand-dunes,desert",
    avatar:
      "https://source.unsplash.com/800x600/?mui-ne,vietnam,sand-dunes,desert",
    initial: "M",
    itineraryCount: 0, // Chưa có itinerary - Mui Ne sand dunes
    memberCount: 4,
    members: createMembers("9", 4, 0),
    createdAt: "2025-01-09",
    created_at: "2025-01-09T00:00:00Z",
    created_by: "user9",
    updated_at: "2025-01-09T00:00:00Z",
    updated_by: "user9",
    isDeleted: false,
    theme: null,
    theme_color: "#6BCB77",
    is_pro: false,
    chatbot_count: 0,
    lastMessage: "Linh: Đang lên kế hoạch",
    unreadCount: 0,
  },
  {
    id: "10",
    name: "Huế - Cố đô di sản",
    description: "Tham quan Đại Nội và lăng tẩm",
    image:
      "https://source.unsplash.com/800x600/?hue,vietnam,imperial-city,forbidden-city",
    avatar:
      "https://source.unsplash.com/800x600/?hue,vietnam,imperial-city,forbidden-city",
    initial: "H",
    itineraryCount: 0, // Chưa có itinerary - Hue imperial city
    memberCount: 11,
    members: createMembers("10", 11, 1),
    createdAt: "2025-01-10",
    created_at: "2025-01-10T00:00:00Z",
    created_by: "user10",
    updated_at: "2025-01-10T00:00:00Z",
    updated_by: "user10",
    isDeleted: false,
    theme: null,
    theme_color: "#FF6B9D",
    is_pro: true,
    chatbot_count: 2,
    lastMessage: "Quang: Tour Đại Nội sáng mai",
    unreadCount: 2,
  },
  {
    id: "11",
    name: "Tam Cốc - Ninh Bình",
    description: "Chèo thuyền sông Ngô Đồng",
    image:
      "https://source.unsplash.com/800x600/?tam-coc,ninh-binh,vietnam,boat,limestone",
    avatar:
      "https://source.unsplash.com/800x600/?tam-coc,ninh-binh,vietnam,boat,limestone",
    initial: "T",
    itineraryCount: 0, // Chưa có itinerary - Tam Coc boat ride
    memberCount: 7,
    members: createMembers("11", 7, 3),
    createdAt: "2025-01-11",
    created_at: "2025-01-11T00:00:00Z",
    created_by: "user11",
    updated_at: "2025-01-11T00:00:00Z",
    updated_by: "user11",
    isDeleted: false,
    theme: null,
    theme_color: "#C44569",
    is_pro: false,
    chatbot_count: 1,
    lastMessage: "Minh: Mua vé chèo thuyền",
    unreadCount: 1,
  },
  {
    id: "12",
    name: "Đà Nẵng - Thành phố biển",
    description: "Bãi biển Mỹ Khê và cầu Rồng",
    image:
      "https://source.unsplash.com/800x600/?da-nang,vietnam,beach,dragon-bridge",
    avatar:
      "https://source.unsplash.com/800x600/?da-nang,vietnam,beach,dragon-bridge",
    initial: "Đ",
    itineraryCount: 0, // Chưa có itinerary - Da Nang beach and dragon bridge
    memberCount: 13,
    members: createMembers("12", 13, 5),
    createdAt: "2025-01-12",
    created_at: "2025-01-12T00:00:00Z",
    created_by: "user12",
    updated_at: "2025-01-12T00:00:00Z",
    updated_by: "user12",
    isDeleted: false,
    theme: null,
    theme_color: "#4834D4",
    is_pro: true,
    chatbot_count: 3,
    lastMessage: "Anh: Xem cầu Rồng phun lửa",
    unreadCount: 6,
  },
];
