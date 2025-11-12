import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  forgotWrap: { alignSelf: "flex-end", marginRight: 20 },
  forgotText: { color: "rgba(235,235,245,0.6)", fontSize: 12 },

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
    width: "90%",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "transparent",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  ctaText: { color: "#b0adadff", fontSize: 18, fontWeight: "700" },

  metaText: { textAlign: "center", color: "#9CA3AF" },
  metaLink: { color: "#fff", fontWeight: "600" },
});
