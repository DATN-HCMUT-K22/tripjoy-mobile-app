import { Image } from "expo-image";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Danh sách ảnh background cho carousel
const BACKGROUND_IMAGES = [
  require("@/assets/images/loading_img.jpg"),
  require("@/assets/images/loading_img_2.jpg"),
  require("@/assets/images/loading_img_3.jpg"),
];

export function SplashLoadingScreen() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const currentIndexRef = useRef(0);
  const scrollViewRef = useRef<any>(null);

  // Auto scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      currentIndexRef.current =
        (currentIndexRef.current + 1) % BACKGROUND_IMAGES.length;
      scrollViewRef.current?.scrollTo({
        x: currentIndexRef.current * SCREEN_WIDTH,
        animated: true,
      });
    }, 3000); // Chuyển ảnh mỗi 3 giây

    return () => clearInterval(interval);
  }, []);

  // Animation cho loading spinner
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Carousel Background */}
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {BACKGROUND_IMAGES.map((image, index) => (
          <Image
            key={index}
            source={image}
            style={styles.backgroundImage}
            contentFit="cover"
          />
        ))}
      </Animated.ScrollView>

      {/* Overlay màu xanh nhạt */}
      <View style={styles.overlay} />

      {/* Logo và Loading Spinner */}
      <View style={styles.contentContainer}>
        {/* Overlay màu xanh phủ lên logo và spinner */}
        <View style={styles.contentOverlay} />

        {/* Logo Tripjoy */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIconContainer}>
            <Image
              source={require("@/assets/logo/white_white.png")}
              style={{ width: 250, height: 250 }}
              contentFit="contain"
            />
            <View style={styles.logoLine} />
          </View>
        </View>

        {/* Loading Spinner ở dưới */}
        <View style={styles.spinnerContainer}>
          <Animated.View
            style={[
              styles.spinnerCircle,
              {
                transform: [{ rotate: spin }],
              },
            ]}
          >
            <View style={styles.spinnerArc} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(52, 178, 125, 0.15)", // Màu xanh nhạt với opacity 15%
  },
  contentContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  contentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(52, 178, 125, 0.2)", // Màu xanh với opacity 20%
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: SCREEN_HEIGHT * 0.15, // Khoảng cách từ logo đến spinner
  },
  logoIconContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    position: "relative",
    height: 40,
    justifyContent: "center",
  },
  logoLine: {
    width: 50,
    height: 2,
    backgroundColor: "#ffffff",
    position: "absolute",
    top: 18,
    left: "50%",
    marginLeft: -25,
    transform: [{ rotate: "15deg" }],
  },
  logoText: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ffffff",
    letterSpacing: 1,
  },
  spinnerContainer: {
    position: "absolute",
    bottom: SCREEN_HEIGHT * 0.1, // 10% từ dưới lên
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerCircle: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerArc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#ffffff",
    borderTopColor: "transparent",
    borderRightColor: "transparent",
  },
});
