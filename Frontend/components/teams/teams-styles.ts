import { StyleSheet } from "react-native";

export const createTeamStyles = StyleSheet.create({
  logoSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  logoIcon: {
    fontSize: 32,
    color: "#ffffff",
  },
  uploadText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  fieldGroup: {
    marginBottom: 24,
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.16)",
    marginBottom: 6,
  },
  chipText: {
    color: "#ffffff",
    fontSize: 12,
  },
  inputContainer: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.36)",
    flexDirection: "row",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  clearButtonText: {
    color: "#ffffff",
    fontSize: 12,
  },
  detailsCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.36)",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    justifyContent: "space-between",
    backgroundColor: "#1d055aab",
    borderRadius: 12 
  },
  disclaimerText: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 4,
  },
  disclaimerContainer: {
    marginTop: 6,
  },
  detailLabel: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
  },
  detailValue: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  visibilityCard: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "rgba(0,0,0,0.36)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  visibilityLabel: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
  },
  createButton: {
    marginTop: 16,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#0052ff",
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  logoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  container: {
    width: "100%",
    alignItems: "center",
    paddingTop: 20,
  },
});
