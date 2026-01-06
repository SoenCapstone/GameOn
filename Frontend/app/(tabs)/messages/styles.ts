import { StyleSheet } from "react-native";

/**
 * Styles for: Frontend/app/(tabs)/messages/index.tsx
 */
export const messagesIndexStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
  },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: {
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "700",
    color: "white",
    marginTop: -2,
  },
  statusText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginLeft: 18,
    marginBottom: 6,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  avatarText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  rowMid: {
    flex: 1,
  },
  name: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 2,
  },
  preview: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
    marginLeft: 10,
  },
  time: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  chev: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 18,
    marginTop: -4,
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
  },

  // (your file references toggleText but didn’t define it originally)
  toggleText: {
    color: "white",
    fontWeight: "700",
  },
});

/**
 * Styles for: Frontend/app/(tabs)/messages/new.tsx
 */
export const messagesNewStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleIcon: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginTop: -2,
  },
  headerSpacer: {
    width: 44,
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 18,
    marginBottom: 12,
    gap: 12,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  tabActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tabText: {
    color: "white",
    fontWeight: "700",
  },

  searchWrap: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  search: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  list: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.15)",
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  actionLink: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  actionLinkDisabled: {
    opacity: 0.5,
  },

  form: {
    paddingHorizontal: 18,
    gap: 12,
    marginTop: 12,
  },
  label: {
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  infoText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },

  loading: {
    marginTop: 40,
  },
  teamsList: {
    maxHeight: 200,
  },
  emptyWrap: {
    padding: 18,
  },
});

/**
 * Styles for: Frontend/app/(tabs)/messages/[chatId].tsx
 */
export const messagesChatStyles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  circleIcon: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
    marginTop: -2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLetter: { color: "white", fontWeight: "800", fontSize: 18 },
  headerText: { flex: 1 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "800" },
  headerSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginTop: 2,
  },
  badge: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  badgeText: { color: "white", fontWeight: "600", fontSize: 12 },
  infoText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.55)",
    marginTop: 6,
    marginBottom: 10,
    fontWeight: "600",
  },
  list: { paddingHorizontal: 14, paddingBottom: 10 },
  bubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    marginBottom: 10,
  },
  bubbleMe: { backgroundColor: "rgba(255,255,255,0.20)" },
  bubbleThem: { backgroundColor: "rgba(0,0,0,0.18)" },
  right: { alignSelf: "flex-end", borderTopRightRadius: 6 },
  left: { alignSelf: "flex-start", borderTopLeftRadius: 6 },
  senderLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginBottom: 2,
  },
  bubbleText: { color: "white", fontSize: 16 },
  timestamp: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  composerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    color: "white",
    backgroundColor: "rgba(255,255,255,0.12)",
    fontSize: 16,
  },
  sendBtn: {
    height: 48,
    minWidth: 68,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "white", fontWeight: "800", fontSize: 15 },
  loadMore: {
    paddingVertical: 12,
    alignItems: "center",
  },
  loadMoreText: {
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
  },
});
