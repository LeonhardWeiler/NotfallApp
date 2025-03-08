import { useState, useEffect } from 'react';
import { View, Text, Button, Alert, TextInput } from 'react-native';
import * as Notifications from 'expo-notifications';

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [message, setMessage] = useState('Notfall! Bitte melde dich sofort!');
  const [roomCreated, setRoomCreated] = useState(false);

  useEffect(() => {
    async function registerForPushNotifications() {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Expo Push Token:', token);
      setExpoPushToken(token);
    }

    registerForPushNotifications();
  }, []);

  // Raum erstellen
  const createRoom = async () => {
    const response = await fetch('http://DEINE_OEFFENTLICHE_IP:3000/createRoom', {
      method: 'POST',
    });
    const data = await response.json();
    setRoomCode(data.roomCode);
    setRoomCreated(true);
    Alert.alert('Raum erstellt', `Raumcode: ${data.roomCode}`);
  };

  // Raum beitreten
  const joinRoom = async () => {
    if (!roomCode || !expoPushToken) return;
    const response = await fetch('http://DEINE_OEFFENTLICHE_IP:3000/joinRoom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, expoPushToken }),
    });
    const data = await response.json();
    if (data.success) {
      Alert.alert('Raum beigetreten', `Du bist nun im Raum ${roomCode}`);
    } else {
      Alert.alert('Fehler', 'Raum nicht gefunden');
    }
  };

  // Notfallbenachrichtigung senden
  const sendEmergencyNotification = async () => {
    if (!roomCode) {
      Alert.alert('Fehler', 'Du musst einem Raum beitreten.');
      return;
    }
    const response = await fetch('http://DEINE_OEFFENTLICHE_IP:3000/sendEmergency', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode, message }),
    });
    const data = await response.json();
    if (data.success) {
      Alert.alert('Notruf gesendet', 'Alle im Raum wurden benachrichtigt');
    } else {
      Alert.alert('Fehler', 'Nachricht konnte nicht gesendet werden');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{roomCreated ? `Raumcode: ${roomCode}` : 'Erstelle einen Raum'}</Text>
      {!roomCreated ? (
        <Button title="Raum erstellen" onPress={createRoom} />
      ) : (
        <>
          <TextInput
            style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20 }}
            placeholder="Raumcode eingeben"
            onChangeText={setRoomCode}
            value={roomCode}
          />
          <Button title="Raum beitreten" onPress={joinRoom} />
        </>
      )}
      <Button title="Notruf senden" onPress={sendEmergencyNotification} />
    </View>
  );
}

