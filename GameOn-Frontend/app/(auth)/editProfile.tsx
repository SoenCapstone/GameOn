import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image, Alert  } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { images } from '@/constants/images';
import { createScopedLog } from '@/utils/logger'; 

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
            colors ={['#dd7200ff', '#000000']}
            locations={[0, 0.7]}
            style={styles.gradient}>

            <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.container}>
                <Text style={styles.header}>Edit Profile</Text>

                    {/* Profile Image */}
                    <Pressable style={({ pressed }) => [ 
                    styles.picture,
                    pressed && { backgroundColor: 'rgba(255, 255, 255, 0.25)' },
                    ]}
                    onPress={pickImage}>
                        <Image source={profilePic} style={styles.profileImage} />
                        <ThemedText style={styles.changePicText}>Change Profile Picture</ThemedText>
                    </Pressable>
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Name</Text>
                    <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your name"
                    placeholderTextColor="#888"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#888"
                    keyboardType="email-address"
                    />
                </View>

                <Pressable style={({pressed}) => [
                    styles.saveButton,
                    pressed && { backgroundColor: 'rgba(0, 179, 0, 0.56)'}]} 
                    onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                </Pressable>

                <Pressable style={({pressed}) => [
                styles.cancelButton,
                pressed && { backgroundColor: 'rgba(240, 11, 11, 0.37)'}]} 
                onPress={() => {router.back(); log.info('Cancelled Profile edit, returning to User Profile page.')}}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
            </ScrollView>
        </LinearGradient>
    </SafeAreaView>
  );
};

export default EditProfile;

// Styles (matching your user profile styling)
const styles = StyleSheet.create({
    gradient:{
        flex: 1,
        position: 'absolute', 
        top: 0,
        left: 0, 
        right: 0, 
        bottom: 0
    },
    container: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 40,
        marginBottom: 20,
        textAlign: "center",
    },
    formGroup: {
        marginBottom: 10,
        marginTop: 10
    },
    label: {
        color: "#bbb",
        fontSize: 20,
        marginBottom: 6,
    },
    input: {
        backgroundColor: "#1e1e1e",
        color: "#fff",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    profileImage: {
        width: 180,
        height: 180,
        borderRadius: 90,
        marginBottom: 1,
        marginHorizontal: 1,
        borderColor: "#858585ff",
        borderWidth: 2,
        alignSelf: "center"
    },
    changePicText: {
        color: 'rgba(128, 219, 255, 0.8)',
        marginTop: 8,
        textDecorationLine: 'underline',
        fontSize: 20,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: "#13a1003b",
        paddingVertical: 14,
        borderRadius: 20,
        alignItems: "center",
        marginTop: 20,
        borderColor: "#0f8000ff",
        borderWidth: 2,
        width: 150,
        alignSelf: "center"
    },
    saveButtonText: {
        color: "#ffffffff",
        fontSize: 18,
        fontWeight: "bold",
    },
    cancelButton: {
        marginTop: 20,
        alignItems: "center",
        backgroundColor: 'rgba(253, 95, 95, 0.1)',
        borderColor: 'rgba(243, 166, 166, 0.8)',
        borderWidth: 1,
        borderRadius: 20,
        paddingTop: 10,
        paddingBottom: 10,
        width: 150,
        alignSelf: "center"
    },
    cancelButtonText: {
        color: "#ffffffff",
        fontSize: 16,
    },

    picture: {
        borderRadius: 12,
        width: 220,
        alignSelf:"center"
    },
    });
