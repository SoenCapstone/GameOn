import { View, Text, StyleSheet } from "react-native";

interface TitleProps {
  title: string;
  subtitle?: string;
}

export function PageTitle({ title, subtitle }: Readonly<TitleProps>) {
  return (
    <View style={styles.container}>
      <Text
        style={[styles.title, subtitle ? styles.titleSmall : undefined]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        allowFontScaling
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
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
  titleSmall: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#999999",
  },
});
