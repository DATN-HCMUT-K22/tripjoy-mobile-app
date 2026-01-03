import { Image } from "expo-image";
import React, { useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const slides = [
  {
    key: "slide-1",
    image: require("@/assets/images/landing_page_1.png"),
    title: "Khám phá nơi bạn muốn đặt chân đến tiếp theo",
    description:
      "Tripify gợi ý điểm đến hợp sở thích, giúp bạn khám phá cộng đồng, lưu hành trình và chuẩn bị cho chuyến đi tiếp theo.",
  },
  {
    key: "slide-2",
    image: require("@/assets/images/landing_page_2.png"),
    title: "Đồng Hành Cùng Bạn\nTrên Mọi Chặng Đường",
    description:
      "Áp dụng lịch trình yêu thích cho chuyến đi của bạn. Trực tiếp xem – chỉnh sửa – tối ưu bằng AI để hành trình luôn phù hợp và mượt mà nhất.",
  },
  {
    key: "slide-3",
    image: require("@/assets/images/landing_page_3.png"),
    title: "Giữ trọn ký ức chuyến đi và chia sẻ chúng theo cách của bạn",
    description:
      "Đăng tải trải nghiệm, hình ảnh và cảm xúc sau mỗi chuyến đi. Lưu lại hành trình đã qua và quản lý các bài viết của bạn một cách dễ dàng.",
  },
];

export function Onboarding({ onDone }) {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [ratios, setRatios] = useState({});

  const isLast = useMemo(() => index === slides.length - 1, [index]);

  const handleMomentumEnd = (e) => {
    const newIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    // Đảm bảo index hợp lệ
    if (newIndex >= 0 && newIndex < slides.length && newIndex !== index) {
      setIndex(newIndex);
    }
  };

  const goNext = () => {
    // Kiểm tra trực tiếp index thay vì dùng isLast để tránh race condition
    if (index >= slides.length - 1) {
      onDone?.();
      return;
    }
    const next = index + 1;
    if (next < slides.length) {
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setIndex(next);
    }
  };

  const goSkip = () => {
    onDone?.();
  };

  const renderItem = ({ item }) => {
    // Kích thước card theo tỷ lệ màn hình, không hardcode pixel
    const cardWidth = SCREEN_WIDTH * 0.82;
    const ratio = ratios[item.key] || 0.62; // fallback ratio

    return (
      <View style={{ width: SCREEN_WIDTH, alignItems: "center" }}>
        {/* Phần nền xanh chiếm khoảng 60% chiều cao, bo cong đáy */}
        <View
          style={{
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT * 0.6,
            backgroundColor: "#2EC989",
            borderBottomLeftRadius: 49,
            borderBottomRightRadius: 49,
            alignItems: "center",
            justifyContent: "flex-end",
            paddingTop: SCREEN_HEIGHT * 0.02, // tỉ lệ theo màn hình
            paddingBottom: 0,
          }}
        >
          <View
            style={{
              width: cardWidth,
              height: cardWidth / ratio,
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              overflow: "hidden",
              backgroundColor: "#ffffff",
            }}
          >
            <Image
              source={item.image}
              style={{ width: "100%", height: "100%" }}
              contentFit="contain" // giữ nguyên ảnh, không crop
              onLoad={(e) => {
                const w = e?.source?.width || 1;
                const h = e?.source?.height || 1;
                const r = w / h;
                setRatios((prev) => {
                  if (prev[item.key] === r) return prev;
                  return { ...prev, [item.key]: r };
                });
              }}
            />
          </View>
        </View>

        {/* Nội dung trắng phía dưới */}
        <View
          style={{
            width: SCREEN_WIDTH - 40,
            alignItems: "center",
            marginTop: 12,
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: "700",
              textAlign: "center",
              color: "#111827",
              marginHorizontal: 20,
              marginTop: 20,
              marginBottom: 12,
            }}
          >
            {item.title}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            textAlign: "center",
            color: "#4B5563",
            marginHorizontal: 32,
            lineHeight: 20,
            marginBottom: 24,
          }}
        >
          {item.description}
        </Text>
      </View>
    );
  };

  const getItemLayout = (data, index) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  const onScrollToIndexFailed = (info) => {
    // Fallback: scroll đến vị trí tính toán
    const wait = new Promise((resolve) => setTimeout(resolve, 500));
    wait.then(() => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: true,
      });
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <FlatList
        ref={listRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={onScrollToIndexFailed}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
          marginTop: 4,
        }}
      >
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <TouchableOpacity
              key={slide.key}
              activeOpacity={0.8}
              onPress={() => {
                listRef.current?.scrollToIndex({ index: i, animated: true });
                setIndex(i);
              }}
              style={{
                width: active ? 28 : 10,
                height: 6,
                borderRadius: 3,
                backgroundColor: active ? "#2EC989" : "#D1D5DB",
                marginHorizontal: 4,
              }}
            />
          );
        })}
      </View>

      <View
        style={{
          flexDirection: "row",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={goSkip}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 999,
            backgroundColor: "#E5F6F0",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Text style={{ color: "#2EC989", fontWeight: "600", fontSize: 16 }}>
            Bỏ qua
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={goNext}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 999,
            backgroundColor: "#2EC989",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#2EC989",
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <Text style={{ color: "#ffffff", fontWeight: "700", fontSize: 16 }}>
            {isLast ? "Bắt đầu" : "Tiếp tục"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
