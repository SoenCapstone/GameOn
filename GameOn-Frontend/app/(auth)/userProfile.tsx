import React from 'react';
import { Image } from 'expo-image';
import { FlatList, StyleSheet, View, ScrollView, Pressable, Text } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '@/constants/images';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createScopedLog } from '@/utils/logger'; 
import { confirmLogout } from '@/utils/onLogout-utils'
import { router } from 'expo-router'


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
        colors ={['#dd7200ff', '#000000']}
        locations={[0, 0.7]}
        style={styles.gradient}>
    <ScrollView 
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
      
      {/* User Section */}
      <View style={styles.header}>
        <Image source={ user.image ? user.image : images.defaultProfile } style={styles.profileImage} />
        <Text style={styles.name}>{user.name}</Text>
        <ThemedText style={styles.email}>{user.email}</ThemedText>

      {/* Edit Profile */}
      <Pressable
        style={({ pressed }) => [ 
        styles.editButton,
        pressed && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
        ]}
        onPress={() => {log.info('Clicked on Edit Profile');
        router.push("/(auth)/editProfile");
        }}
        >
          <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
        </Pressable>

        <View style={styles.separator} />

      

      {/* Leagues Section */}
        <Text style={styles.sectionTitle}>My Leagues</Text>
        <FlatList
          data={leagues}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
            onPress={() => log.info('Clicked: ', item.name)}
            style = {({pressed}) => [
            styles.leagueItem,
            pressed && { backgroundColor: 'rgba(89, 38, 184, 0.56)'}
            ]}>
            <View>
              <ThemedText style={styles.leagueName}>{item.name}</ThemedText>
              <ThemedText style={styles.leagueRole}>{item.role}</ThemedText>
            </View>
            </Pressable>
          )}
        />

      {/* Logout */}
        <Pressable style={({pressed}) => [
          styles.buttonLogOut,
          pressed && { backgroundColor: 'rgba(240, 11, 11, 0.37)'}
        ]}
        onPress={() => confirmLogout()}>
          <ThemedText style={styles.buttonLogoutText}>Logout</ThemedText>
        </Pressable>
        </View>
        </ScrollView>
      </LinearGradient>
</SafeAreaView>
  );
}

export default UserProfile;

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 180,
    height: 180,
    borderRadius: 60,
    marginBottom: 10,
    marginTop: 50,
    marginHorizontal: 1,
    
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', // faint white line
    marginTop: 20,
    alignSelf: 'center',
    width: 350
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffffff',
    marginTop: 10
  },
  email: {
    color: '#6b7280',
    marginBottom: 8,
    fontSize: 20
  },
  gradient: { 
    flex: 1,
    position: 'absolute', 
    top: 0,
    left: 0, 
    right: 0, 
    bottom: 0
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 20,
    color: '#ffffffff',
  },
  editButton: {
  marginTop: 5,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 25,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.3)',
},
buttonText: {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: 20,
  fontWeight: '400',
},

buttonLogOut: {
  borderRadius: 25,
  marginBottom: 70,
  marginTop: 10,
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderWidth: 1,
  alignItems: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderColor: 'rgba(243, 166, 166, 0.8)', 
},
  buttonLogoutText: {  
    fontSize: 20,
    fontWeight: '400',
    color: 'rgba(243, 166, 166, 0.8)',
  },
  leagueItem: {
    backgroundColor: 'transparent',
    borderColor: '#444444ff',
    borderWidth: 1,
    padding: 14,
    paddingHorizontal: 60,
    borderRadius: 10,
    marginBottom: 10,
  },
  leagueName: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffffff',
  },
  leagueRole: {
    color: '#6b7280',
    fontSize: 16,
  },
});
