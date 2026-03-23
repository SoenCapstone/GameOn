import { Badge } from "@/components/messages/badge";
import { Bubble } from "@/components/messages/bubble";
import type { ChatListRow } from "@/constants/messaging";

export function chatListKeyExtractor(item: ChatListRow) {
  return item.type === "date" ? item.id : item.message.id;
}

export function renderLegendChatItem({ item }: { item: ChatListRow }) {
  if (item.type === "date") {
    return <Badge label={item.label} />;
  }
  return <Bubble message={item.message} />;
}
