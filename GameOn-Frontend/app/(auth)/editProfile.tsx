import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Image, Alert  } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { images } from '@/constants/images';
import { createScopedLog } from '@/utils/logger'; 
import { Colors } from '@/constants/colors'
import { profileStyles } from '@/components/UserProfile/profile-styles';


const EditProfile = () => {
    const router = useRouter();
    const log = createScopedLog('Profile')
    // Local state for form fields
    const [name, setName] = useState("John Doe");
    const [email, setEmail] = useState("john.doe@example.com");
    const [profilePic, setProfilePic] = useState(images.defaultProfile);

    const validateEmail = (email: string) => {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        return emailRegex.test(email);
    };

    const handleSave = () => {

        if (!name.trim()){
            Alert.alert('Name must not be empty', 'Please enter a Name');
            return;
        }

        if (!validateEmail(email)){
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        // For now, just log the updated data
        log.info("Updated Profile:", { name, email });
        // Redirect back to profile page
        
        router.push("/(auth)/userProfile");
    };


    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        });

        if (!result.canceled && result.assets.length > 0) {
        setProfilePic({ uri: result.assets[0].uri });
        }
    };
    return (
    <SafeAreaView style={{ flex: 1 }}>
        <LinearGradient 
            colors ={[Colors.orange, '#000000']}
            locations={[0, 0.7]}
            style={profileStyles.gradient}>

            <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={profileStyles.container}>
                <Text style={profileStyles.header}>Edit Profile</Text>

                    {/* Profile Image */}
                    <Pressable style={({ pressed }) => [ 
                    profileStyles.pictureBorder,
                    pressed && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                    ]}
                    onPress={pickImage}>
                        <Image source={profilePic} style={profileStyles.profileImage} />
                        <ThemedText style={profileStyles.changePicText}>Change Profile Picture</ThemedText>
                    </Pressable>
                <View style={profileStyles.formGroup}>
                    <Text style={profileStyles.label}>Name</Text>
                    <TextInput
                    style={profileStyles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#888"
                    />
                </View>

                <View style={profileStyles.formGroup}>
                    <Text style={profileStyles.label}>Email</Text>
                    <TextInput
                    style={profileStyles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    />
                </View>

                <Pressable style={({pressed}) => [
                    profileStyles.saveButton,
                    pressed && { backgroundColor: Colors.green}]} 
                    onPress={handleSave}>
                    <Text style={profileStyles.saveButtonText}>Save Changes</Text>
                </Pressable>

                <Pressable style={({pressed}) => [
                profileStyles.cancelButton,
                pressed && { backgroundColor: 'rgba(240, 11, 11, 0.37)'}]} 
                onPress={() => {router.back(); log.info('Cancelled Profile edit, returning to User Profile page.')}}>
                    <Text style={profileStyles.cancelButtonText}>Cancel</Text>
                </Pressable>
            </ScrollView>
        </LinearGradient>
    </SafeAreaView>
  );
};

export default EditProfile;

