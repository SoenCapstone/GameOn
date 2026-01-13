import React from "react";
import { ContentArea } from "@/components/ui/content-area";
import { View, Text } from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Card } from "@/components/ui/card";
import { ButtonItem } from "@/components/form/button-item";
import { styles, denyColor } from "@/components/teams/homepage-styles";

type Invite = {
  id: string;
  teamName: string;
  inviterName?: string;
};

export default function Home() {
  const [tab, setTab] = React.useState<"updates" | "spectating">("updates");

  // Placeholder data - to be replaced
  const invites: Invite[] = [
    { id: "inv_1", teamName: "Concordia Lions", inviterName: "John Doe" },
  ];

  const handleAccept = (inviteId: string) => {
    console.log("accept", inviteId);
  };

  const handleDeny = (inviteId: string) => {
    console.log("deny", inviteId);
  };

  return (
    <ContentArea backgroundProps={{ preset: "blue" }}>
      <View style={styles.container}>
        <SegmentedControl
          values={["My Updates", "Spectating"]}
          selectedIndex={tab === "updates" ? 0 : 1}
          onValueChange={(value) => {
            if (value === "My Updates") setTab("updates");
            if (value === "Spectating") setTab("spectating");
          }}
          style={styles.segmented}
        />

        {tab === "updates" ? (
          <View style={styles.cardWrap}>
            {invites.map((invite) => (
              <Card key={invite.id}>
                <Text style={styles.teamName}>{invite.teamName}</Text>

                <Text style={styles.inviteText}>
                  You received an invite
                  {invite.inviterName ? ` from ${invite.inviterName}` : ""} to
                  join {invite.teamName}.
                </Text>

                <View style={styles.actionsRow}>
                  <ButtonItem
                    label="Deny"
                    color={denyColor}
                    onPress={() => handleDeny(invite.id)}
                  />
                  <ButtonItem
                    label="Accept"
                    onPress={() => handleAccept(invite.id)}
                  />
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View />
        )}
      </View>
    </ContentArea>
  );
}
