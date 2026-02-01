import { StyleSheet } from "react-native";

export const settingsStyles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 999,
  },
  deleteButton: {
    marginTop: -16,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#dc2626",
  },
  deleteButtonDisabled: {
    backgroundColor: "#ef5350",
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
