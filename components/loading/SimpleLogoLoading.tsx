import { Image } from "expo-image";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export function SimpleLogoLoading() {
  return (
    <View style={styles.container}>
      {/* Logo Tripjoy */}
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/logo/green.png")}
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
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 32,
  },
  spinnerContainer: {
    marginTop: 24,
  },
});
