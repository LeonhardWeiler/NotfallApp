import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  const useExpoPushToken = () => {
    const [expoPushToken, setExpoPushToken] = useState(null);

    useEffect(() => {
      const registerForPushNotifications = async () => {
        try {
          const { status } = await Notifications.getPermissionsAsync();
          if (status !== 'granted') {
            const { status: newStatus } = await Notifications.requestPermissionsAsync();
            if (newStatus !== 'granted') {
              Alert.alert('Hinweis', 'Push-Benachrichtigungen sind deaktiviert!');
              return;
            }
          }
          const token = (await Notifications.getExpoPushTokenAsync()).data;
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

  const expoPushToken = useExpoPushToken();

  useEffect(() => {
    const fetchRoomCode = async () => {
      try {
        const storedCode = await AsyncStorage.getItem('roomCode');
        if (storedCode) {
          setRoomCode(storedCode);
          return;
        }

        const response = await fetch('http://178.114.121.23:3000/createRoom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        const textResponse = await response.text();
        console.log('Server Response:', textResponse);
        const data = JSON.parse(textResponse);

        if (data.roomCode) {
          setRoomCode(data.roomCode);
          await AsyncStorage.setItem('roomCode', data.roomCode);
        } else {
          throw new Error('Ungültige Antwort vom Server');
        }
      } catch (error) {
        Alert.alert('Fehler', `Konnte Raum nicht erstellen: ${error.message || 'Unbekannter Fehler'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomCode();
  }, []);

  const joinRoom = useCallback(async () => {
    const trimmedCode = inputCode.trim();

    if (!/^\w{5}$/.test(trimmedCode)) {
      Alert.alert('Fehler', 'Bitte einen gültigen 5-stelligen Code eingeben');
      return;
    }

    try {
      const response = await fetch('http://178.114.121.23:3000/joinRoom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: trimmedCode, expoPushToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Beitritt fehlgeschlagen');
      }

      setHasJoined(true);
      Alert.alert('Erfolg', `Dem Raum ${trimmedCode} beigetreten!`);
    } catch (error) {
      Alert.alert('Fehler', error.message || 'Netzwerkfehler, bitte versuche es später erneut.');
    }
  }, [inputCode, expoPushToken]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}>
            Raum Code: {roomCode || 'Nicht verfügbar'}
          </Text>
          <TextInput
            placeholder="Raum Code eingeben"
            value={inputCode}
            onChangeText={setInputCode}
            maxLength={5}
            style={{
              borderWidth: 1,
              padding: 10,
              width: 200,
              textAlign: 'center',
              marginBottom: 20,
              borderRadius: 5,
            }}
          />
          <TouchableOpacity
            onPress={joinRoom}
            disabled={hasJoined}
            style={{
              backgroundColor: hasJoined ? 'gray' : 'blue',
              padding: 12,
              borderRadius: 5,
              opacity: hasJoined ? 0.5 : 1,
              alignItems: 'center',
              width: 200,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>Raum beitreten</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
