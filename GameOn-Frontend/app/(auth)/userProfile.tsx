import React from 'react';
import { Image } from 'expo-image';
import { Alert, FlatList, StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '@/constants/images';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createScopedLog } from '@/utils/logger'; 
import { router } from 'expo-router'
//import NavBar from '@/components/bottom Navbar'

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

export default function UserProfile() {

  // define logout behavior here
  const onLogout = () => {
    log.info('User confirmed logout');
    // authContext.logout();

    //navigate to sign in page
    router.replace('/(auth)/sign-in')
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient 
        colors ={['#824300ff', '#000000']}
        locations={[0, 0.7]}
        style={styles.gradient}>
    <ScrollView 
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
      
      {/* User Section */}
      <View style={styles.header}>
        <Image source={ user.image ? user.image : images.defaultProfile } style={styles.profileImage} />
        <ThemedText style={styles.name}>{user.name}</ThemedText>
        <ThemedText style={styles.email}>{user.email}</ThemedText>

      {/* Edit Profile */}
      
      <Pressable
        style={({ pressed }) => [ 
        styles.editButton,
        pressed && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
        ]}
        onPress={() => log.info('Clicked on Edit Profile')}
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
      onPress={() => log.info('Clicked: ', item.name)}
      style = {({pressed}) => [
      styles.leagueItem,
      pressed && { backgroundColor: 'rgba(89, 38, 184, 0.56)'}
    ]}
    >
            <View>
              <ThemedText style={styles.leagueName}>{item.name}</ThemedText>
              <ThemedText style={styles.leagueDivision}>{item.role}</ThemedText>
            </View>
            </Pressable>
          )}
        />

      {/* Logout */}
        <Pressable style={({pressed}) => [
          styles.buttonLogOut,
          pressed && { backgroundColor: 'rgba(240, 11, 11, 0.37)'},
        ]}
        onPress={() => {
          Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
          { text: "Cancel", style: "cancel" },
          { text: "Log Out", onPress: onLogout, style: "destructive" }
        ]); } }>
          <ThemedText style={styles.buttonLogoutText}>Logout</ThemedText>
        </Pressable>
        </View>
        </ScrollView>
      </LinearGradient>
      {/*<NavBar></NavBar>*/}
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 60,
    marginBottom: 1,
    marginTop: 40,
    marginHorizontal: 1,
    
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffffff',
  },
  email: {
    color: '#6b7280',
    marginBottom: 8,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#ffffffff',
    textDecorationLine: 'underline'
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
  fontSize: 15,
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
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(243, 166, 166, 0.8)',
  },
  leagueItem: {
    backgroundColor: 'transparent',
    borderColor: '#444444ff',
    borderWidth: 1,
    padding: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 10,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffffff',
  },
  leagueDivision: {
    color: '#6b7280',
    fontSize: 14,
  },
});
