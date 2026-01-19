import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },

  // Tabs
  tabsGlass: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    overflow: "hidden",
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  tabMiddle: {
    marginHorizontal: 6,
  },
  tabText: {
    color: "rgba(255,255,255,0.75)",
    fontWeight: "700",
  },
  tabTextActive: {
    color: "white",
  },

  // Table header
  tableHeaderGlass: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  hRank: { width: 22, color: "rgba(255,255,255,0.8)", fontWeight: "700" },
  hTeam: { flex: 1, color: "rgba(255,255,255,0.8)", fontWeight: "700" },
  hStat: {
    width: 26,
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
  },
  hGD: {
    width: 38,
    textAlign: "center",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
  },
  hPts: {
    width: 40,
    textAlign: "right",
    color: "rgba(255,255,255,0.8)",
    fontWeight: "700",
  },

  // List rows
  listContent: {
    paddingBottom: 120,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },

  rankPill: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  rankText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "700",
  },

  teamCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  teamBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  teamBadgeText: {
    color: "#111",
    fontWeight: "900",
    fontSize: 11,
  },
  teamNameWrap: {
    flex: 1,
  },

  // Placeholder skeleton blocks
  skelName: {
    height: 14,
    width: "70%",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  skelNum: {
    height: 12,
    width: 16,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  skelNumSmall: {
    height: 12,
    width: 22,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  statsCell: { width: 26, alignItems: "center" },
  gdCell: { width: 38, alignItems: "center" },
  ptsCell: { width: 40, alignItems: "flex-end" },

  // Floating buttons (glass)
  fabRow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 22,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fabGlass: {
    width: 56,
    height: 56,
    borderRadius: 999,
    overflow: "hidden",
  },
  fabPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fabIcon: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  screen: {
  flex: 1,
},
emptyWrap: {
  marginTop: 120,
  alignItems: "center",
},

emptyTitle: {
  color: "white",
  fontSize: 22,
  fontWeight: "700",
},

emptySubtitle: {
  marginTop: 6,
  color: "rgba(255,255,255,0.7)",
  fontSize: 14,
},


});
