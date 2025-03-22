import React, { useEffect, useState } from "react";
import { View, Text, Button, TextInput, TouchableOpacity, FlatList, Vibration } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Modal from "react-native-modal";
import AlertModal from "./components/AlertModal";
import styles from "./styles"; // Import der Styles

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

      if (data.type === "alert") {
        showAlert("Notfall!", data.message);
        Vibration.vibrate(500);
      }

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
    roomInput && setRoomInput("");
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
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
      connectWebSocket(room, newName, false);
    }
    await AsyncStorage.setItem("name", newName);
    setName(newName);
    setDialogVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Name ändern */}
      <AlertModal isVisible={alertVisible} title={alertData.title} message={alertData.message} onClose={() => setAlertVisible(false)} />
      <TouchableOpacity onPress={changeName} style={styles.nameButton}>
        <Text style={styles.nameText}>{name}</Text>
      </TouchableOpacity>

      <Modal isVisible={isDialogVisible} backdropOpacity={0.5}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Name ändern</Text>
          <TextInput style={styles.input} onChangeText={setNewName} value={newName} placeholder="Neuer Name" placeholderTextColor="#888" />
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => setDialogVisible(false)}>
              <Text style={styles.cancelButton}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={saveNewName}>
              <Text style={styles.saveButton}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {room ? (
        <View style={styles.roomContainer}>
          <Text style={styles.roomText}>Raumcode: {room}</Text>

          {/* Notfallbutton */}
          <TouchableOpacity onPress={sendEmergency} style={styles.emergencyButton}>
            <Text style={styles.emergencyButtonText}>🚨 NOTFALL</Text>
          </TouchableOpacity>

          {/* Mitgliederliste */}
          <View style={styles.memberList}>
            <FlatList data={members} renderItem={({ item }) => <Text style={styles.memberText}>{item}</Text>} keyExtractor={(item, index) => index.toString()} />
          </View>

          <View style={styles.leaveButtonContainer}>
            <Button title="Raum verlassen" onPress={leaveRoom} color="#FF9800" />
          </View>
        </View>
      ) : (
          <View style={styles.joinContainer}>
            <Button title="Raum erstellen" onPress={createRoom} color="#2196F3" />

            {/* Input mit Pfeil */}
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Raumcode eingeben"
                onChangeText={setRoomInput}
                style={styles.roomInput}
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={roomInput}
                onSubmitEditing={() => joinRoom() }
                returnKeyType="done"
              />

              {/* Pfeil-Button nur anzeigen, wenn `roomInput` nicht leer ist */}
              {roomInput.length === 5 && !isNaN(roomInput) && (
                <TouchableOpacity onPress={joinRoom} style={styles.arrowButton}>
                  <Text style={styles.arrowText}>➜</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
    </View>
  );
};

export default App;

