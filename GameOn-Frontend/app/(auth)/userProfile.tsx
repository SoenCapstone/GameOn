import React from 'react';
import { Image } from 'expo-image';
import { FlatList, StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { LinearGradient } from 'expo-linear-gradient';
import { images } from '@/constants/images';
import { SafeAreaView } from 'react-native-safe-area-context';

// Sample league data (replace with fetched data later)
const leagues = [
  { id: '1', name: 'Champions League', role: 'Player' },
  //{ id: '2', name: 'Premier League', role: 'Player' },
  { id: '3', name: 'La Liga', role: 'Admin' },
];

export default function UserProfile() {
  const user = {
    name: 'John Doe',
    email: 'johndoe@email.com',
    image: images.defaultProfile,
    };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient 
        colors ={['#000000', '#4B0082']}
        style={{ flex: 1 }}>
    <ScrollView 
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}>
      
      {/* Header Section */}
      <View style={styles.header}>
        <ThemedView style={styles.imageSection}>
        <Image source={ user.image } style={styles.profileImage} />
        </ThemedView>
        <ThemedText style={styles.name}>{user.name}</ThemedText>
        <ThemedText style={styles.email}>{user.email}</ThemedText>

      {/* Actions */}
      <Pressable
        style={({ pressed }) => [
        styles.editButton,
        pressed && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
        ]}>
          <ThemedText style={styles.buttonText}>Edit Profile</ThemedText>
        </Pressable>
      

      {/* Leagues Section */}
        <ThemedText style={styles.sectionTitle}>My Leagues</ThemedText>
        <FlatList
          data={leagues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.leagueItem}>
              <ThemedText style={styles.leagueName}>{item.name}</ThemedText>
              <ThemedText style={styles.leagueDivision}>{item.role}</ThemedText>
            </View>
          )}
        />

      {/* Logout */}
        <Pressable style={({pressed}) => [
          styles.button,
          pressed && { backgroundColor: 'rgba(240, 11, 11, 0.37)'},
        ]}>
          <ThemedText style={styles.buttonLogoutText}>Logout</ThemedText>
        </Pressable>
        </View>
        </ScrollView>
      </LinearGradient>
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
    marginTop: 1,
    marginHorizontal: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  email: {
    color: '#6b7280',
    marginBottom: 8,
  },
  imageSection:{
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 10,
    marginHorizontal:10,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
    color: '#505d6fff',
    textDecorationLine: 'underline'
  },
  sectionText: {
    color: '#4b5563',
    lineHeight: 20,
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

button: {
  borderRadius: 25,
  marginBottom: 15,
  marginTop: 15,
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
    backgroundColor: '#dbdbdbbe',
    borderColor: '#000000ff',
    borderWidth: 1,
    padding: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginBottom: 10,
  },
  leagueName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  leagueDivision: {
    color: '#6b7280',
    fontSize: 14,
  },
});
