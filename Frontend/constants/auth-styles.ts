import { StyleSheet } from "react-native";

export const authStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0 },

  hero: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 1,
    pointerEvents: "none",
  },

  container: { gap: 20 },

  label: {
    marginLeft: 16,
    color: "rgba(235,235,245,0.6)",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  },

  inputWrap: {
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, fontSize: 17, color: "#bab8b8ff" },
  rightIcon: { marginLeft: 8 },

  errorText: { color: "#EF4444", fontSize: 12, marginLeft: 16 },
});
