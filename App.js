import React, { useEffect, useState } from "react";
import { View, Text, Button, TextInput, TouchableOpacity, FlatList, Alert, Platform, } from "react-native";
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
  const [newName, setNewName] = useState("");

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

      if (storedName) {
        setName(storedName);
      } else {
        const randomName = generateRandomName();
        setName(randomName);
        await AsyncStorage.setItem("name", randomName);
      }

      if (storedRoom) {
        setRoom(storedRoom);
        connectWebSocket(storedRoom);
      }
    };

    loadStorage();
  }, []);

  // 🔌 WebSocket-Verbindung aufbauen
  const connectWebSocket = (roomCode) => {
    const socket = new WebSocket("ws://178.114.126.100:3000");

    socket.onopen = () => {
      const joinMessage = JSON.stringify({ type: "join", room: roomCode, name });
      console.log("📨 Sende WebSocket-Nachricht:", joinMessage); // Debugging
      socket.send(joinMessage);
    };

    socket.onerror = (error) => {
      console.error("❌ WebSocket-Fehler:", error);
      Alert.alert("Verbindungsfehler", "Der Server ist nicht erreichbar!");
    };

    socket.onclose = () => {
      console.log("❌ Verbindung getrennt!");
      Alert.alert("Verbindung getrennt", "Die Verbindung zum Server wurde unterbrochen.");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "error") {
        Alert.alert("Fehler", data.message);
        setRoom(null); // ❌ Raum nicht setzen, wenn Fehler kommt!
        return;
      }

      if (data.type === "members") {
        setMembers(data.members);
      }

      if (data.type === "joined") {
        console.log("✅ Erfolgreich beigetreten!");
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

    setWs(socket);
  };

  // 🏠 Raum erstellen
  const createRoom = async () => {
    const roomCode = Math.random().toString(36).slice(2, 8).toLowerCase();
    await AsyncStorage.setItem("room", roomCode);
    setRoom(roomCode);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ "type": "create", "room": roomCode, "name": name }));
    }
  };

  // 🔗 Raum beitreten
  const joinRoom = () => {
    if (!roomInput.trim()) {
      Alert.alert("Fehler", "Bitte einen gültigen Raumcode eingeben.");
      return;
    }

    console.log("🔍 Beitreten mit Raumcode:", roomInput); // Debugging

    setRoom(roomInput);
    AsyncStorage.setItem("room", roomInput);
    connectWebSocket(roomInput);
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

    ws.send(JSON.stringify({ type: "emergency", room }));
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
    <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
      {/* Name ändern */}
      <TouchableOpacity onPress={changeName}>
        <Text style={{ fontSize: 24, fontWeight: "bold" }}>{name}</Text>
      </TouchableOpacity>

      <Dialog.Container visible={isDialogVisible}>
        <Dialog.Title>Name ändern</Dialog.Title>
        <Dialog.Input onChangeText={setNewName} value={newName} />
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
              value={roomInput}
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
  );
};

export default App;

