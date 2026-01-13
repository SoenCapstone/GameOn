import { Text, Pressable, StyleSheet, View, ScrollView } from "react-native";
import { Card } from "@/components/ui/card";
import { PlayerAssignmentPanelProps } from "./model";
import { assignPlayerToShape } from "./utils";

export const PlayerAssignmentPanel = ({
  data,
  selectedShapeId,
  shapes,
  setShapes,
}: PlayerAssignmentPanelProps) => {
  return (
    <ScrollView
      style={{ flex: 1, paddingVertical: 10 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.list}>
        {data?.map((member) => {
          const isMemberAssignedToShape = shapes?.filter(
            (shape) =>
              shape.associatedPlayerId === member.id &&
              shape.id === selectedShapeId
          ).length;
          return (
            <View
              key={member.id}
              style={[!!isMemberAssignedToShape && styles.cardWrapperAssigned]}
            >
              <Card>
                <View style={styles.row}>
                  <Text style={styles.name}>
                    {member.firstname} {member.lastname}
                  </Text>

                  <Pressable
                    onPress={() => {
                      assignPlayerToShape(
                        member.id,
                        selectedShapeId,
                        shapes,
                        setShapes
                      );
                    }}
                    style={({ pressed }) => [
                      styles.assignButton,
                      pressed && styles.assignButtonPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Assign ${member.firstname} ${member.lastname} to player icon`}
                  >
                    <Text style={styles.assignButtonText}>Assign</Text>
                  </Pressable>
                </View>
              </Card>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  cardWrapperAssigned: {
    borderRadius: 34,
    overflow: "hidden",
    borderColor: "rgba(0,255,120,0.85)",
    borderWidth: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  name: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.9,
    flexShrink: 1,
  },
  assignButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  assignButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  assignButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.95,
  },
});
