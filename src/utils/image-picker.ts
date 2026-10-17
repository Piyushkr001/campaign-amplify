import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * Launches the device photo library to pick an image.
 * Handles permissions, cancellations, and errors gracefully without crashing.
 */
export async function pickImageFromLibrary(): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Access to your photo library is required to select campaign and ad visuals. Please enable permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.warn('Image picker error:', error);
    Alert.alert('Image Error', 'Failed to select image. Please try again.');
    return null;
  }
}
