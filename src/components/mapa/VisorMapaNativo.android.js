// src/components/VisorMapaNativo.android.js
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { COLORS } from "../../constants/theme";

export default function VisorMapaNativo({ htmlSource, onMessage, webViewRef }) {
  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html: htmlSource }}
      style={styles.webview}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      startInLoadingState={true}
      onMessage={onMessage}
      renderLoading={() => (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F8FAFC",
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
});
