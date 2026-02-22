import { StyleSheet } from "react-native";

export const matchStyles = StyleSheet.create({
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8
  },
  sectionBody: {
    gap: 10,
  },
  emptyText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
  },
  cardPressable: {
    borderRadius: 34,
    overflow: "hidden",
  },
  cardSurface: {
    width: "100%",
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(92, 16, 16, 0.38)",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingLeft: 0,
    paddingRight: 0
  },
  card: {
    borderRadius: 28,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  sideColumn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 8,
    gap: 10,
  },
  centerColumn: {
    flex: 1.1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    paddingHorizontal: 4,
    gap: 6,
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 42,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  teamName: {
    color: "rgba(235,235,245,0.68)",
    fontSize: 18,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
    maxWidth: "100%",
    paddingHorizontal: 6,
  },
  contextLabel: {
    color: "rgba(235,235,245,0.52)",
    fontSize: 14,
    fontWeight: "500",
  },
  scoreText: {
    color: "rgba(235,235,245,0.65)",
    fontSize: 14,
    fontWeight: "300",
    lineHeight: 54,
    textAlign: "center",
  },
  dateText: {
    color: "rgba(235,235,245,0.65)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  scorePending: {
    color: "rgba(235,235,245,0.56)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  skeletonBlock: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 8,
  },
  skeletonHeader: {
    height: 18,
    width: "55%",
    marginBottom: 12,
  },
  skeletonLine: {
    height: 16,
    width: "85%",
    marginBottom: 8,
  },
  skeletonFooter: {
    height: 14,
    width: "40%",
  },
  retryButton: {
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  fabWrap: {
    position: "absolute",
    right: 20,
    bottom: 20,
    alignItems: "flex-end",
    gap: 10,
  },
  fabMenu: {
    borderRadius: 20,
    padding: 10,
    minWidth: 170,
    gap: 8,
  },
  fabMenuAction: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  fabMenuText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  errorInline: {
    color: "#ffb5b5",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
  },
});

export const statusColors: Record<string, string> = {
  PENDING: "rgba(240,174,46,0.9)",
  CONFIRMED: "rgba(35,166,85,0.95)",
  CANCELLED: "rgba(189,44,44,0.95)",
  COMPLETED: "rgba(44,106,189,0.95)",
};
