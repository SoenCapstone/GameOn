import React from 'react';
import { Image } from 'expo-image';
import { FlatList, View, Pressable, Text, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { images } from '@/constants/images';
import { ContentArea } from "@/components/ui/content-area";
import { createScopedLog } from '@/utils/logger'; 
import { router } from 'expo-router'
import { Colors } from '@/constants/colors'
import { useAuth, useUser } from "@clerk/clerk-expo";
import { profileStyles } from '@/components/UserProfile/profile-styles';
import { confirmLogout } from "@/components/UserProfile/profileUtils";

// Sample league data (replace with fetched data later)
const leagues = [
  { id: '1', name: 'Champions League', role: 'Player' },
  { id: '2', name: 'Premier League', role: 'Player' },
  { id: '3', name: 'La Liga', role: 'Admin' },
];


const log = createScopedLog('Profile')

const UserProfile = () => {
  
  const { signOut } = useAuth();
  
  const logout = confirmLogout(signOut, log);

  const { isLoaded, isSignedIn, user } = useUser();

  const isDev = (user?.publicMetadata as { isDev?: boolean })?.isDev === true;

  if (!isLoaded || !isSignedIn) return null;

  
  return (
    <ContentArea
          scrollable
          paddingBottom={60}
          backgroundProps={{ preset: "orange" }}
        >
      {/* User Section */}
      <View style={profileStyles.main}>
        <Image source={ user.hasImage ? { uri: user.imageUrl } : images.defaultProfile } style={profileStyles.profileImage} />
        <Text style={profileStyles.name}>{user.fullName}</Text>
        <ThemedText style={profileStyles.email}>{user.primaryEmailAddress?.emailAddress}</ThemedText>

      {/* Edit Profile */} 
      <Pressable
        style={({ pressed }) => [ 
        profileStyles.editButton,
        pressed && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
        ]}
        onPress={() => {log.info('Clicked on Edit Profile');
        router.push("/profile/editProfile"); 
        }}
        >
          <ThemedText style={profileStyles.editButtonText}>Edit Profile</ThemedText>
        </Pressable>

        <View style={profileStyles.separator} />

      

      {/* Leagues Section */}
        <Text style={profileStyles.sectionTitle}>My Leagues</Text>
        <FlatList
          data={leagues}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
            onPress={() => log.info('Clicked: ', item.name)}
            style = {({pressed}) => [
            profileStyles.leagueItem,
            pressed && { backgroundColor: Colors.purple}
            ]}>
            <View>
              <ThemedText style={profileStyles.leagueName}>{item.name}</ThemedText>
              <ThemedText style={profileStyles.leagueRole}>{item.role}</ThemedText>
            </View>
            </Pressable>
          )}
        />

      {/* Logout */}
        <Pressable style={({pressed}) => [
          profileStyles.buttonLogOut,
          pressed && { backgroundColor: Colors.red}
        ]}
        onPress={() => logout()}>
          <ThemedText style={profileStyles.buttonLogoutText}>Logout</ThemedText>
        </Pressable>

        {/* Dev / Feature flags button */}
                {isDev && (
                  <Pressable
                    style={({ pressed }) => [
                      profileStyles.flagsButton,
                      pressed && { backgroundColor: "rgba(255, 255, 255, 0.18)" },
                    ]}
                    onPress={() => router.push("../(contexts)/feature-flags")}
                  >
                    <ThemedText style={profileStyles.flagsButtonText}>
                      Feature Flags
                    </ThemedText>
                  </Pressable>
                )}
        
                {isDev && (
                  <Pressable
                    style={({ pressed }) => [
                      profileStyles.flagsButton,
                      pressed && { backgroundColor: "rgba(255, 255, 255, 0.18)" },
                    ]}
                    onPress={() => router.push("/_sitemap")}
                  >
                    <ThemedText style={profileStyles.flagsButtonText}>
                      {" "}
                      Open Sitemap{" "}
                    </ThemedText>
                  </Pressable>
                )}

        </View>
        </ContentArea>
  );
}

export default UserProfile;
