import { router } from "expo-router";
import { log } from "@/utils/logger";
import { Alert } from 'react-native';

export const onLogout = () => {
    log.info('User confirmed logout');
    // authContext.logout();

    //navigate to sign in page
    router.replace('/(auth)/sign-in')
  };

export const confirmLogout = (onLogout: () => void) => {
  Alert.alert(
    "Confirm Logout",
    "Are you sure you want to log out?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", onPress: onLogout, style: "destructive" },
    ]
  );
};