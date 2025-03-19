import { useState, useEffect } from 'react';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useExpoPushToken = () => {
  const [expoPushToken, setExpoPushToken] = useState(null);

  useEffect(() => {
    const registerForPushNotifications = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('expoPushToken');
        if (storedToken) {
          setExpoPushToken(storedToken);
          return;
        }

        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          if (newStatus !== 'granted') {
            Alert.alert('Hinweis', 'Push-Benachrichtigungen sind deaktiviert!');
            return;
          }
        }

        const token = (await Notifications.getExpoPushTokenAsync()).data;
        await AsyncStorage.setItem('expoPushToken', token);
        setExpoPushToken(token);
      } catch (error) {
        console.error('Fehler beim Abrufen des Push-Tokens:', error);
      }
    };

    if (Platform.OS !== 'web') {
      registerForPushNotifications();
    }
  }, []);

  return expoPushToken;
};

