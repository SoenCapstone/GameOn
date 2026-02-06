import React from "react";
import {
  Text,
  View,
  StyleSheet,
  ImageSourcePropType,
  Pressable,
} from "react-native";
import { Card } from "@/components/ui/card";
import { Image } from "expo-image";
import { IconSymbol } from "@/components/ui/icon-symbol";

interface InfoCardProps {
  readonly title: string;
  readonly subtitle: string;
  readonly image: ImageSourcePropType;
  readonly onPress: () => void;
}

export function InfoCard({
  title,
  subtitle,
  image,
  onPress,
}: Readonly<InfoCardProps>) {
  let contentNode: React.ReactNode;
  contentNode = (
    <Image
      source={image}
      style={StyleSheet.absoluteFillObject}
      contentFit="contain"
    />
  );

  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={styles.card}>
          <View style={styles.content}>
            <View style={styles.image}>{contentNode}</View>
            <View style={styles.text}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>
          <View>
            <IconSymbol name="chevron.right" color="#8C8C8C" size={18} />
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    width: "auto",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  image: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    width: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: "semibold",
    color: "#D9D9D9",
  },
  subtitle: {
    fontSize: 15,
    color: "#8C8C8C",
  },
});
