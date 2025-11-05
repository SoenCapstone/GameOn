import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  forgotWrap: { alignSelf: "flex-end", marginTop: 8 },
  forgotText: { color: "#D1D5DB", fontSize: 12 },

  statusBox: {
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#7F1D1D",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  statusText: {
    color: "#FCA5A5",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },

  cta: {
    alignSelf: "center",
    width: "50%",
    backgroundColor: "#fff",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  ctaText: { color: "#111", fontSize: 18, fontWeight: "700" },

  metaText: { textAlign: "center", color: "#9CA3AF" },
  metaLink: { color: "#fff", fontWeight: "600" },
});