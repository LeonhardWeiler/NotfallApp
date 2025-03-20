import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, Button, TextInput, TouchableOpacity, FlatList, Alert, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Dialog from "react-native-dialog";

// Zufälligen Namen generieren
const generateRandomName = () => {
  return `user${Math.floor(10000 + Math.random() * 90000)}`;
};

const App = () => {
  const [name, setName] = useState("");
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [roomInput, setRoomInput] = useState("");
  const [ws, setWs] = useState(null);
  const [isDialogVisible, setDialogVisible] = useState(false);
  const [newName, setNewName] = useState(name);

  // 📢 Push-Benachrichtigungen konfigurieren
  useEffect(() => {
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("emergency-channel", {
        name: "Notfall Benachrichtigungen",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 500, 500],
        lightColor: "#FF231F7C",
      });
    }

    const requestPermission = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        alert("Erlaube Push-Benachrichtigungen für Notfälle!");
      }
    };

    requestPermission();

    const loadStorage = async () => {
      const storedName = await AsyncStorage.getItem("name");
      const storedRoom = await AsyncStorage.getItem("room");

      let finalName = storedName || generateRandomName();

      setName(finalName);
      setNewName(finalName);
      await AsyncStorage.setItem("name", finalName);

      if (storedRoom) {
        connectWebSocket(storedRoom, finalName, false);
      }
    };

    loadStorage();
  }, []);

  // 🔌 WebSocket-Verbindung aufbauen
  const connectWebSocket = (roomCode, userName, create) => {
    const socket = new WebSocket("ws://178.114.126.100:3000");

    socket.onopen = () => {
      if (create) {
        console.log(`🚀 WebSocket verbunden und erstelle Raum: ${roomCode}`);
        socket.send(JSON.stringify({ type: "create", room: roomCode, name: userName }));
        return;
      }
      console.log(`📡 WebSocket verbunden mit Raum: ${roomCode}`);
      socket.send(JSON.stringify({ type: "join", room: roomCode, name: userName }));
    };

    socket.onerror = async (error) => {
      console.log("❌ WebSocket-Fehler:", error);
      Alert.alert("Verbindungsfehler", "Der Server ist nicht erreichbar!");
      setRoom(null);
      await AsyncStorage.removeItem("room");
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "error") {
        Alert.alert("Fehler", data.message);
        setRoom(null);
        await AsyncStorage.removeItem("room");
        return;
      }

      if (data.type === "members") {
        setMembers(data.members);
      }

      if (data.type === "created") {
        console.log(`🏠 Raum erfolgreich erstellt: ${data.room}`);
        setWs(socket);
        setRoom(roomCode);
        await AsyncStorage.setItem("room", roomCode);
      }

      if (data.type === "joined") {
        console.log("✅ Erfolgreich beigetreten!");
        setWs(socket);
        setRoom(roomCode);
        await AsyncStorage.setItem("room", roomCode);
      }

      if (data.type === "alert") {
        Notifications.scheduleNotificationAsync({
          content: {
            title: "🚨 Notfall!",
            body: data.message,
          },
          trigger: null,
        });

        Alert.alert("Notfall!", data.message);
      }
    };

    socket.onclose = () => {
      console.log("❌ Verbindung getrennt!");
    };
  };

  // 🏠 Raum erstellen
  const createRoom = () => {
    const roomCode = Math.random().toString(36).slice(2, 8).toLowerCase();
    connectWebSocket(roomCode, name, true);
  };

  // 🔗 Raum beitreten
  const joinRoom = () => {
    if (!roomInput.trim()) {
      Alert.alert("Fehler", "Bitte einen gültigen Raumcode eingeben.");
      return;
    }

    connectWebSocket(roomInput, name, false);
  };

  // 🚪 Raum verlassen
  const leaveRoom = () => {
    setRoom(null);
    setMembers([]);
    AsyncStorage.removeItem("room");

    if (ws) ws.close();
  };

  // 🚨 Notfall senden
  const sendEmergency = () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      Alert.alert("Fehler", "WebSocket nicht verbunden!");
      return;
    }

    ws.send(JSON.stringify({ type: "emergency", room, name }));
  };

  // ✏️ Name ändern
  const changeName = async () => {
    setDialogVisible(true);
  };

  const saveNewName = async () => {
    setName(newName);
    await AsyncStorage.setItem("name", newName);
    setDialogVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
        {/* Name ändern */}
        <TouchableOpacity onPress={changeName}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>{name}</Text>
        </TouchableOpacity>

        <Dialog.Container visible={isDialogVisible}>
          <Dialog.Title>Name ändern</Dialog.Title>
          <Dialog.Input style={{ color:"black" }} onChangeText={setNewName} value={newName} />
          <Dialog.Button label="Abbrechen" onPress={() => setDialogVisible(false)} />
          <Dialog.Button label="Speichern" onPress={saveNewName} />
        </Dialog.Container>

        {room ? (
          <>
            {/* Raumcode anzeigen */}
            <Text style={{ fontSize: 18 }}>Raumcode: {room}</Text>

            {/* Notfallbutton */}
            <TouchableOpacity onPress={sendEmergency} style={{ backgroundColor: "red", padding: 15, marginTop: 20 }}>
              <Text style={{ color: "white", fontSize: 20 }}>🚨 NOTFALL</Text>
            </TouchableOpacity>

            {/* Mitgliederliste */}
            <FlatList
              data={members}
              renderItem={({ item }) => <Text>{item}</Text>}
              keyExtractor={(item, index) => index.toString()}
            />

            {/* Raum verlassen */}
            <Button title="Raum verlassen" onPress={leaveRoom} />
          </>
        ) : (
            <>
              {/* Raum erstellen */}
              <Button title="Raum erstellen" onPress={createRoom} />

              {/* Raumcode eingeben */}
              <TextInput
                placeholder="Raumcode eingeben"
                onChangeText={setRoomInput}
                style={{
                  borderBottomWidth: 1,
                  marginVertical: 10,
                  width: 200,
                  color: "black",
                }}
                placeholderTextColor="gray"
              />

              {/* Raum beitreten */}
              <Button title="Raum beitreten" onPress={joinRoom} />
            </>
          )}
      </View>
    </SafeAreaView>
  );
};

export default App;

