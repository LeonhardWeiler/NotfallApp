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
      const storedName = await AsyncStorage.getItem("name");
      const storedRoom = await AsyncStorage.getItem("room");

      let finalName = storedName || generateRandomName();

      await AsyncStorage.setItem("name", finalName);
      setName(finalName);
      setNewName(finalName);

      storedRoom && connectWebSocket(storedRoom, finalName, false);
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
        await AsyncStorage.setItem("room", roomCode);
        setWs(socket);
        setRoom(roomCode);
        console.log(`🏠 Raum erfolgreich erstellt: ${data.room}`);
      }

      if (data.type === "joined") {
        await AsyncStorage.setItem("room", roomCode);
        setWs(socket);
        setRoom(roomCode);
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
    const roomCode = Math.floor(10000 + Math.random() * 90000);
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
    await AsyncStorage.setItem("name", newName);
    setName(newName);
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

