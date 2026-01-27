import { Image } from "expo-image";
import { StyleSheet, Text } from "react-native";
import { images } from "@/constants/images";
import { ContentArea } from "@/components/ui/content-area";
import { useUser } from "@clerk/clerk-expo";

export default function Profile() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded || !isSignedIn) return null;

  return (
    <ContentArea
      scrollable
      paddingBottom={60}
      backgroundProps={{ preset: "orange" }}
    >
      <Image
        source={user.hasImage ? { uri: user.imageUrl } : images.defaultProfile}
        style={styles.image}
      />
      <Text style={styles.name}>{user.fullName}</Text>
    </ContentArea>
  );
}

const styles = StyleSheet.create({
  image: {
    width: 140,
    height: 140,
    borderRadius: 100,
    alignSelf: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "600",
    color: "white",
    alignSelf: "center",
  },
});
