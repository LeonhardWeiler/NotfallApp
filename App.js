import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, Button, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Dialog from "react-native-dialog";

// Zufälligen Namen generieren
const generateRandomName = () => `user${Math.floor(10000 + Math.random() * 90000)}`;

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
    const loadStorage = async () => {
      const storedRoom = await AsyncStorage.getItem("room");
      const storedName = await AsyncStorage.getItem("name");
      setRoom(storedRoom);

      (storedName && storedRoom) && connectWebSocket(storedRoom, storedName, false);

      let finalName = storedName || generateRandomName();
      await AsyncStorage.setItem("name", finalName);
      setName(finalName);
      setNewName(finalName)
    };

    loadStorage();
  }, []);

  // 🔌 WebSocket-Verbindung aufbauen
  const connectWebSocket = (roomCode, userName, create) => {
    const socket = new WebSocket("ws://178.114.126.100:3000");

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: create ? "create" : "join",
        room: roomCode,
        name: userName
      }));
      console.log(`📡 WebSocket verbunden mit Raum: ${roomCode}`);
    };

    socket.onerror = async (error) => {
      await AsyncStorage.removeItem("room");
      setRoom(null);
      console.log("❌ WebSocket-Fehler:", error);
      Alert.alert("Verbindungsfehler", "Der Server ist nicht erreichbar!");
    };

    socket.onclose = () => console.log("❌ Verbindung getrennt!");

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "members") setMembers(data.members);

      if (data.type === "alert") Alert.alert("Notfall!", data.message);

      if (data.type === "created") {
        setRoom(roomCode);
        setWs(socket);
        await AsyncStorage.setItem("room", roomCode);
        console.log(`🏠 Raum erfolgreich erstellt: ${data.room}`);
      }

      if (data.type === "joined") {
        setRoom(roomCode);
        setWs(socket);
        await AsyncStorage.setItem("room", roomCode);
        console.log("✅ Erfolgreich beigetreten!");
      }

      if (data.type === "error") {
        Alert.alert("Fehler", data.message);
        setRoom(null);
        await AsyncStorage.removeItem("room");
      }
    };
  };

  // 🏠 Raum erstellen
  const createRoom = () => {
    const roomCode = Math.floor(10000 + Math.random() * 90000).toString();
    connectWebSocket(roomCode, name, true);
  };

  // 🔗 Raum beitreten
  const joinRoom = () => {
    if (!roomInput.trim() || roomInput.length !== 5 || isNaN(roomInput)) {
      Alert.alert("Fehler", "Bitte einen gültigen Raumcode eingeben.");
      return;
    }

    connectWebSocket(roomInput, name, false);
  };

  // 🚪 Raum verlassen
  const leaveRoom = () => {
    AsyncStorage.removeItem("room");
    setRoom(null);
    setMembers([]);
    ws && ws.close();
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
  const changeName = async () => setDialogVisible(true);

  // 🔄 Neuen Namen speichern
  const saveNewName = async () => {
    if (ws) {
      ws.close();
      connectWebSocket(room, newName, false);
    }
    await AsyncStorage.setItem("name", newName);
    setName(newName);
    setDialogVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212", paddingBlock: 50 }}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {/* Name ändern */}
        <TouchableOpacity onPress={changeName}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff" }}>{name}</Text>
        </TouchableOpacity>

        <Dialog.Container visible={isDialogVisible}>
          <Dialog.Title>Name ändern</Dialog.Title>
          <Dialog.Input style={{ color: "black" }} onChangeText={setNewName} value={newName} />
          <Dialog.Button label="Abbrechen" onPress={() => setDialogVisible(false)} />
          <Dialog.Button label="Speichern" onPress={saveNewName} />
        </Dialog.Container>

        {room ? (
          <>
            <Text style={{ fontSize: 18, color: "#bbb", marginVertical: 10 }}>Raumcode: {room}</Text>

            {/* Notfallbutton */}
            <TouchableOpacity onPress={sendEmergency} style={{ backgroundColor: "#D32F2F", padding: 20, borderRadius: 10, marginVertical: 20 }}>
              <Text style={{ color: "white", fontSize: 24, fontWeight: "bold" }}>🚨 NOTFALL</Text>
            </TouchableOpacity>

            {/* Mitgliederliste */}
            <FlatList
              data={members}
              renderItem={({ item }) => <Text style={{ color: "#fff" }}>{item}</Text>}
              keyExtractor={(item, index) => index.toString()}
            />

            <Button title="Raum verlassen" onPress={leaveRoom} color="#FF9800" />
          </>
        ) : (
          <>
            <Button title="Raum erstellen" onPress={createRoom} color="#2196F3" />

            <TextInput
              placeholder="Raumcode eingeben"
              onChangeText={setRoomInput}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#bbb",
                marginVertical: 15,
                width: 200,
                color: "white",
                textAlign: "center",
              }}
              placeholderTextColor="#888"
            />

            <Button title="Raum beitreten" onPress={joinRoom} color="#4CAF50" />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default App;

