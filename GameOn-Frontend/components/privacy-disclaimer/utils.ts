import {
  Alert,
  Linking,
} from 'react-native';
import { POLICY_URL } from './constants'

export const openPolicy = async () => {
  const ok = await Linking.canOpenURL(POLICY_URL);
  if (ok) {
    await Linking.openURL(POLICY_URL);
  } else {
    Alert.alert('Unable to open link', POLICY_URL);
  }
};