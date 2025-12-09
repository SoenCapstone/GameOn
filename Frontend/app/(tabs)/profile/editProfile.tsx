import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { images } from "@/constants/images";
import { createScopedLog } from "@/utils/logger";
import { Colors } from "@/constants/colors";
import { profileStyles } from "@/components/UserProfile/profile-styles";
import { ContentArea } from "@/components/ui/content-area";
import { useUser } from "@clerk/clerk-expo";
import { handleSaveProfile } from "@/components/UserProfile/profile-utils";
import { ProfileImageSelector } from "@/components/UserProfile/ProfileImageSelector";

const EditProfile = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const log = createScopedLog("Profile");

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email] = useState<string>(
    user?.primaryEmailAddress?.emailAddress ?? "",
  );
  const [profilePic, setProfilePic] = useState(
    user?.hasImage ? { uri: user.imageUrl } : images.defaultProfile,
  );

  const handleSave = () => {
    handleSaveProfile({ user, firstName, lastName, email, profilePic, router });
  };

  if (!isLoaded || !isSignedIn) return null;

  return (
    <ContentArea
      scrollable
      paddingBottom={60}
      backgroundProps={{ preset: "orange" }}
    >
      <Text style={profileStyles.header}>Edit Profile</Text>

      <ProfileImageSelector
        profilePic={profilePic}
        setProfilePic={setProfilePic}
      />

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

      <Pressable
        style={({ pressed }) => [
          profileStyles.saveButton,
          pressed && { backgroundColor: Colors.green },
        ]}
        onPress={handleSave}
      >
        <Text style={profileStyles.saveButtonText}>Save Changes</Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          profileStyles.cancelButton,
          pressed && { backgroundColor: "rgba(240, 11, 11, 0.37)" },
        ]}
        onPress={() => {
          router.back();
          log.info("Cancelled Profile edit, returning to User Profile page.");
        }}
      >
        <Text style={profileStyles.cancelButtonText}>Cancel</Text>
      </Pressable>
    </ContentArea>
  );
};

export default EditProfile;
