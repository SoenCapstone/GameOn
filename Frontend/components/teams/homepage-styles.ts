import { StyleSheet } from "react-native";

export const denyColor = "rgba(255,255,255,0.75)";

export const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  segmented: {
    marginBottom: 16,
    width: "90%",
  },
  cardWrap: {
    width: "90%",
    gap: 12,
  },
  teamName: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  inviteText: {
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
    justifyContent: "flex-end",
  },
  actionButton: {
    flex: 1,
  },
});
