import React from "react";
import { Image } from "expo-image";
import { FlatList, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ThemedText } from "@/components/themed-text";
import { images } from "@/constants/images";
import { createScopedLog } from "@/utils/logger";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { ContentArea } from "@/components/ui/content-area";
import { profileStyles as styles } from "@/components/profile/profileStyle";

const leagues = [
  { id: "1", name: "Champions League", role: "Player" },
  { id: "2", name: "Premier League", role: "Player" },
  { id: "3", name: "La Liga", role: "Admin" },
];

const userDetails = {
  name: "John Doe",
  email: "johndoe@email.com",
  image: images.defaultProfile,
};

const log = createScopedLog("Profile");

export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuth();

  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded || !isSignedIn) return null;

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: () => {
            log.info("User confirmed logout");
            signOut();
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <ContentArea
      scrollable
      paddingBottom={60}
      backgroundProps={{ preset: "orange" }}
    >
      {/* User Section */}
      <View style={styles.header}>
        <Image
          source={userDetails.image ? userDetails.image : images.defaultProfile}
          style={styles.profileImage}
        />
        <ThemedText style={styles.name}>{user.fullName}</ThemedText>
        <ThemedText style={styles.email}>
          {user.primaryEmailAddress?.emailAddress}
        </ThemedText>

        {/* Edit Profile */}
        <Pressable
          style={({ pressed }) => [
            styles.editButton,
            pressed && { backgroundColor: "rgba(255, 255, 255, 0.25)" },
          ]}
          onPress={() => log.info("Clicked on Edit Profile")}
        >
          <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
        </Pressable>

        {/* Leagues Section */}
        <ThemedText style={styles.sectionTitle}>My Leagues</ThemedText>
        <FlatList
          data={leagues}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => log.info("Clicked league: ", item.name)}
              style={({ pressed }) => [
                styles.leagueItem,
                pressed && {
                  backgroundColor: "rgba(89, 38, 184, 0.56)",
                },
              ]}
            >
              <View>
                <ThemedText style={styles.leagueName}>{item.name}</ThemedText>
                <ThemedText style={styles.leagueDivision}>
                  {item.role}
                </ThemedText>
              </View>
            </Pressable>
          )}
        />

        {/* Logout */}
        <Pressable
          style={({ pressed }) => [
            styles.buttonLogOut,
            pressed && { backgroundColor: "rgba(240, 11, 11, 0.37)" },
          ]}
          onPress={handleLogout}
        >
          <ThemedText style={styles.buttonLogoutText}>Logout</ThemedText>
        </Pressable>

        {/* Dev / Feature flags button */}
        {__DEV__ && (
          <Pressable
            style={({ pressed }) => [
              styles.flagsButton,
              pressed && { backgroundColor: "rgba(255, 255, 255, 0.18)" },
            ]}
            onPress={() => router.push("../(contexts)/feature-flags")}
          >
            <ThemedText style={styles.flagsButtonText}>
              Feature Flags
            </ThemedText>
          </Pressable>
        )}

        {__DEV__ && (
          <Pressable
            style={({ pressed }) => [
              styles.flagsButton,
              pressed && { backgroundColor: "rgba(255, 255, 255, 0.18)" },
            ]}
            onPress={() => router.push("/_sitemap")}
          >
            <ThemedText style={styles.flagsButtonText}>
              {" "}
              Open Sitemap{" "}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </ContentArea>
  );
}
