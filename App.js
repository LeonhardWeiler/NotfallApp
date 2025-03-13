import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const fetchRoomCode = async () => {
      try {
        const storedCode = await AsyncStorage.getItem('roomCode');
        if (storedCode) {
          setRoomCode(storedCode);
        } else {
          const response = await fetch('http://178.114.121.23:3000/createRoom');
          const data = await response.json();
          if (data.code) {
            setRoomCode(data.code);
            await AsyncStorage.setItem('roomCode', data.code);
          }
        }
      } catch (error) {
        Alert.alert('Fehler', 'Konnte Raum nicht erstellen');
      }
    };

    fetchRoomCode();
  }, []);

  const joinRoom = () => {
    if (inputCode.length === 5) {
      setHasJoined(true);
      Alert.alert('Erfolg', `Dem Raum ${inputCode} beigetreten!`);
    } else {
      Alert.alert('Fehler', 'Bitte einen gültigen 5-stelligen Code eingeben');
    }
  };

  return (
    <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Raum Code: {roomCode}</Text>
      <TextInput
        placeholder='Raum Code eingeben'
        value={inputCode}
        onChangeText={setInputCode}
        maxLength={5}
        style={{ borderWidth: 1, padding: 10, marginVertical: 20, width: 200, textAlign: 'center' }}
      />
      <Button title='Raum beitreten' onPress={joinRoom} disabled={hasJoined} />
    </View>
  );
}

