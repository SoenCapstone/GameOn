import React from 'react';
import { Image } from 'expo-image';
import { FlatList, View, ScrollView, Pressable, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '@/constants/images';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createScopedLog } from '@/utils/logger'; 
import { confirmLogout } from '@/utils/onLogout-utils'
import { router } from 'expo-router'
import { Colors } from '@/constants/colors'
import { profileStyles } from '@/components/UserProfile/profile-styles';

// Sample league data (replace with fetched data later)
const leagues = [
  { id: '1', name: 'Champions League', role: 'Player' },
  { id: '2', name: 'Premier League', role: 'Player' },
  { id: '3', name: 'La Liga', role: 'Admin' },
];

// Sample user data (replace with fetched data later)
const user = {
    name: 'John Doe',
    email: 'johndoe@email.com',
    image: images.defaultProfile,
    };

const log = createScopedLog('Profile')

const UserProfile = () => {

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient 
        colors ={[Colors.orange, '#000000']}
        locations={[0, 0.7]}
        style={profileStyles.gradient}>
    <ScrollView 
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
      
      {/* User Section */}
      <View style={profileStyles.main}>
        <Image source={ user.image ? user.image : images.defaultProfile } style={profileStyles.profileImage} />
        <Text style={profileStyles.name}>{user.name}</Text>
        <ThemedText style={profileStyles.email}>{user.email}</ThemedText>

      {/* Edit Profile */}
      <Pressable
        style={({ pressed }) => [ 
        profileStyles.editButton,
        pressed && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
        ]}
        onPress={() => {log.info('Clicked on Edit Profile');
        router.push("/(auth)/editProfile");
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
        onPress={() => confirmLogout()}>
          <ThemedText style={profileStyles.buttonLogoutText}>Logout</ThemedText>
        </Pressable>
        </View>
        </ScrollView>
      </LinearGradient>
</SafeAreaView>
  );
}

export default UserProfile;
