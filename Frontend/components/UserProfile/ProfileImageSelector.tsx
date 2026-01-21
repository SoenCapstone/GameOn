import React from "react";
import { Pressable, Image } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { pickImage } from "@/components/UserProfile/profile-utils";
import { profileStyles } from "@/components/UserProfile/profile-styles";

type ProfilePic = { uri: string };

interface Props {
  profilePic: ProfilePic;
  setProfilePic: (pic: ProfilePic) => void;
}

export const ProfileImageSelector = ({ profilePic, setProfilePic }: Props) => {
  return (
    <Pressable
      style={({ pressed }) => [
        profileStyles.pictureBorder,
        pressed && { backgroundColor: "rgba(255, 255, 255, 0.25)" },
      ]}
      onPress={() => pickImage(setProfilePic)}
    >
      <Image source={profilePic} style={profileStyles.profileImage} />
      <ThemedText style={profileStyles.changePicText}>
        Change Profile Picture
      </ThemedText>
    </Pressable>
  );
};
