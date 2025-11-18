import { View, Text, StyleSheet } from "react-native";

interface TitleProps {
  title: string;
}

export function PageTitle({ title }: Readonly<TitleProps>) {
  return (
    <View style={styles.container}>
      <Text
        style={styles.title}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        allowFontScaling
      >
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "white",
  },
});
