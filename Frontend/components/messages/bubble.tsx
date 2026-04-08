import { formatMessageTimestamp } from "@/utils/messaging/utils";
import { StyleSheet, Text, View } from "react-native";

export type BubbleMessage = {
  readonly id: string;
  readonly text: string;
  readonly fromMe: boolean;
  readonly senderLabel?: string;
  readonly createdAt: string;
};

export function Bubble({
  message,
}: Readonly<{
  message: BubbleMessage;
}>) {
  const isMine = message.fromMe;
  return (
    <View style={[styles.row, isMine ? styles.mine : styles.theirs]}>
      <View style={isMine ? styles.self : styles.peer}>
        {!isMine && message.senderLabel ? (
          <Text style={styles.name}>{message.senderLabel}</Text>
        ) : null}
        <Text style={styles.message}>{message.text}</Text>
        <Text style={styles.time}>
          {formatMessageTimestamp(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: "80%",
    borderRadius: 18,
    marginBottom: 10,
    borderCurve: "continuous",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  mine: {
    alignSelf: "flex-end",
    borderColor: "rgba(255,255,255,0.45)",
  },
  theirs: {
    alignSelf: "flex-start",
    borderColor: "rgba(255,255,255,0.32)",
  },
  self: {
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#1A5D2A",
  },
  peer: {
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(44, 44, 46, 0.55)",
  },
  message: {
    color: "white",
    fontSize: 16,
  },
  name: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "500",
  },
  time: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    textAlign: "right",
  },
});
