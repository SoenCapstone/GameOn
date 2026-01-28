import { Pressable, Image } from "react-native";
import { pickImage } from "@/components/UserProfile/profile-utils";
import { profileStyles } from "@/components/UserProfile/profile-styles";
import { GlassView } from "expo-glass-effect";

interface Props {
  profilePic: any;
  setProfilePic: (pic: any) => void;
}

export const ProfileImageSelector = ({ profilePic, setProfilePic }: Props) => {
  return (
    <Pressable
      style={profileStyles.pictureBorder}
      onPress={() => pickImage(setProfilePic)}
    >
      <GlassView isInteractive={true} style={profileStyles.profileImage}>
        <Image source={profilePic} style={profileStyles.profileImage} />
      </GlassView>
    </Pressable>
  );
};
