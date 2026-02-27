import { View, StyleSheet, Pressable } from "react-native";
import { PlayMakerBoardProps } from "@/components/play-maker/model";
import { DefaultBoard } from "@/components/play-maker/play-maker-board-configurations/play-maker-default-board";

export const PlayMakerBoard = ({
  onBoardPress,
  boardConfig: BoardConfig,
  children,
}: PlayMakerBoardProps) => {
  const BoardWrapper = BoardConfig ?? DefaultBoard;

  return (
    <View style={styles.wrap}>
      <Pressable
        testID="playmaker-board-pressable"
        style={styles.board}
        onPress={(e) => {
          if (!onBoardPress) return;
          const { locationX, locationY } = e.nativeEvent;
          onBoardPress({ x: locationX, y: locationY });
        }}
      >
        <BoardWrapper>{children}</BoardWrapper>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  board: {
    flex: 1,
    margin: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
});
