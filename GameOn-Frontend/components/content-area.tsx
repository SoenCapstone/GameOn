import { View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";

interface ContentAreaProps {
  readonly children: React.ReactNode;
}

export default function ContentArea({ children }: Readonly<ContentAreaProps>) {
  const headerHeight = useHeaderHeight();

  return (
    <View
      style={{
        flex: 1,
        paddingTop: headerHeight + 10,
        paddingHorizontal: 16,
        rowGap: 14,
      }}
    >
      {children}
    </View>
  );
}
