import { ContentArea } from "@/components/ui/content-area";
import { View } from "react-native";

export default function Settings() {
  return (
    <ContentArea
      scrollable
      backgroundProps={{ preset: "orange", mode: "form" }}
    >
      <View />
    </ContentArea>
  );
}
