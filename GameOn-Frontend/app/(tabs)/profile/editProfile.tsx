import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Image, Alert  } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { images } from '@/constants/images';
import { createScopedLog } from '@/utils/logger'; 
import { Colors } from '@/constants/colors'
import { profileStyles } from '@/components/UserProfile/profile-styles';
import { ContentArea } from "@/components/ui/content-area";
import { useUser } from "@clerk/clerk-expo";


const EditProfile = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const userId = user?.id;
    const router = useRouter();
    const log = createScopedLog('Profile')

    const [firstName, setFirstName] = useState(user?.firstName ?? "");
    const [lastName, setLastName] = useState(user?.lastName ?? "");
    const [email] = useState<string>(user?.primaryEmailAddress?.emailAddress ?? "");
    const [profilePic, setProfilePic] = useState(user?.hasImage ? user.imageUrl : images.defaultProfile );

    
    //handle saving of updated credentials
    const handleSave = async () => {

        if (!firstName?.trim()){
            Alert.alert('First Name must not be empty', 'Please enter a valid First Name');
            return;
        }

        if (!lastName?.trim()){
            Alert.alert('Last Name must not be empty', 'Please enter a valid Last Name');
            return;
        }

        try {
            if (user) {
                await user.update({
                    firstName: firstName,
                    lastName: lastName,
                });
            }

            Alert.alert("Success", "Profile updated");

        }
        catch (err: any) {
            console.error("Fetch error:", err.message);
            Alert.alert("Error", "Failed to update profile: " + err.message);
            }

        log.info("Updated Profile:", { userId, firstName, lastName, email });

        // Redirect back to profile page
        router.push("/(tabs)/profile");
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
    
    if (!isLoaded || !isSignedIn) return null;

    return (
    <ContentArea
              scrollable
              paddingBottom={60}
              backgroundProps={{ preset: "orange" }}>
                
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
                    <Text style={profileStyles.label}>First Name</Text>
                    <TextInput
                    style={profileStyles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Enter your name"
                    placeholderTextColor="#888"
                    />
                </View>

                <View style={profileStyles.formGroup}>
                    <Text style={profileStyles.label}>Last Name</Text>
                    <TextInput
                    style={profileStyles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Enter your name"
                    placeholderTextColor="#888"
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
            </ContentArea>
  );
};

export default EditProfile;

