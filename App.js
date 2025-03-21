import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, Button, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Modal from "react-native-modal";
import AlertModal from "./components/AlertModal";

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
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertData, setAlertData] = useState({ title: "", message: "" });

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

  const showAlert = (title, message) => {
    setAlertData({ title, message });
    setAlertVisible(true);
  };

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
      showAlert("Verbindungsfehler", "Der Server ist nicht erreichbar!");
    };

    socket.onclose = () => console.log("❌ Verbindung getrennt!");

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "members") setMembers(data.members);

      if (data.type === "alert") showAlert("Notfall!", data.message);

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
        showAlert("Fehler", data.message);
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
      showAlert("Fehler", "Bitte einen gültigen Raumcode eingeben.");
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
      showAlert("Fehler", "WebSocket nicht verbunden!");
      return;
    }

    ws.send(JSON.stringify({ type: "emergency", room, name }));
  };

  // ✏️ Name ändern
  const changeName = async () => setDialogVisible(true);

  // 🔄 Neuen Namen speichern
  const saveNewName = async () => {
    if (!newName.trim()) {
      showAlert("Fehler", "Bitte einen Namen eingeben.");
      return;
    }
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

        <Modal isVisible={isDialogVisible} backdropOpacity={0.5}>
          <View style={{ backgroundColor: "#222", padding: 20, borderRadius: 10 }}>
            <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Name ändern</Text>
            <TextInput
              style={{
                color: "white",
                borderBottomColor: "#666",
                borderBottomWidth: 1,
                marginBottom: 20,
                fontSize: 16
              }}
              onChangeText={setNewName}
              value={newName}
              placeholder="Neuer Name"
              placeholderTextColor="#888"
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity onPress={() => setDialogVisible(false)}>
                <Text style={{ color: "#FF9800", fontSize: 16 }}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveNewName}>
                <Text style={{ color: "#4CAF50", fontSize: 16 }}>Speichern</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
        <AlertModal isVisible={alertVisible} title={alertData.title} message={alertData.message} onClose={() => setAlertVisible(false)} />
      </View>
    </SafeAreaView>
  );
};

export default App;

