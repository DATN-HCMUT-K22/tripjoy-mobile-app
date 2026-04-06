import { Image } from "expo-image";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/** Kích thước gốc assets/logo/green.png — khớp tỷ lệ để không bị “cắt” trong khung vuông nhỏ */
const LOGO_SRC = require("@/assets/logo/green.png");
const LOGO_ASPECT = 467 / 430;

export function SimpleLogoLoading() {
  return (
    <View style={styles.container}>
      {/* Logo Tripjoy */}
      <View style={styles.logoContainer}>
        <Image
          source={LOGO_SRC}
          style={styles.logo}
          contentFit="contain"
        />

        {/* Loading Spinner */}
        <View style={styles.spinnerContainer}>
          <ActivityIndicator size="large" color="#34B27D" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    overflow: "visible",
  },
  logo: {
    width: 280,
    height: Math.round(280 / LOGO_ASPECT),
    marginBottom: 32,
  },
  spinnerContainer: {
    marginTop: 24,
  },
});
