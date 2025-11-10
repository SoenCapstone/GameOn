import { View, Text } from "react-native";

interface TitleProps {
  title: string;
}

export default function PageTitle({ title }: Readonly<TitleProps>) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 17, fontWeight: "600", color: "white" }}>
        {title}
      </Text>
    </View>
  );
}
