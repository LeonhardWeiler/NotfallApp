import React, { useEffect, useState } from "react";
import { View, Text, Button, TextInput, TouchableOpacity, FlatList, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PushNotification from "react-native-push-notification";

const generateRandomName = () => {
    const names = ["User123", "RandomGuy", "Guest456", "Player789"];
    return names[Math.floor(Math.random() * names.length)];
};

const App = () => {
    const [name, setName] = useState("");
    const [room, setRoom] = useState(null);
    const [members, setMembers] = useState([]);
    const [roomInput, setRoomInput] = useState("");
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const loadStorage = async () => {
            const storedName = await AsyncStorage.getItem("name");
            const storedRoom = await AsyncStorage.getItem("room");

            if (storedName) setName(storedName);
            else {
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

    const connectWebSocket = (roomCode) => {
        const socket = new WebSocket("ws://178.114.126.100:3000");
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: "join", room: roomCode, name }));
        };
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "members") setMembers(data.members);
            if (data.type === "alert") {
                PushNotification.localNotification({
                    title: "Notfall!",
                    message: data.message,
                });
                Alert.alert("Notfall!", data.message);
            }
        };
        setWs(socket);
    };

    const createRoom = () => {
        const roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
        setRoom(roomCode);
        AsyncStorage.setItem("room", roomCode);
        connectWebSocket(roomCode);
    };

    const joinRoom = () => {
        setRoom(roomInput);
        AsyncStorage.setItem("room", roomInput);
        connectWebSocket(roomInput);
    };

    const leaveRoom = () => {
        setRoom(null);
        setMembers([]);
        AsyncStorage.removeItem("room");
        if (ws) ws.close();
    };

    const sendEmergency = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "emergency", room }));
        }
    };

    return (
        <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
            <TouchableOpacity onPress={() => {
                const newName = prompt("Neuer Name:");
                if (newName) {
                    setName(newName);
                    AsyncStorage.setItem("name", newName);
                }
            }}>
                <Text style={{ fontSize: 24, fontWeight: "bold" }}>{name}</Text>
            </TouchableOpacity>

            {room ? (
                <>
                    <Text style={{ fontSize: 18 }}>Raumcode: {room}</Text>
                    <TouchableOpacity onPress={sendEmergency} style={{ backgroundColor: "red", padding: 15, marginTop: 20 }}>
                        <Text style={{ color: "white", fontSize: 20 }}>NOTFALL</Text>
                    </TouchableOpacity>
                    <FlatList
                        data={members}
                        renderItem={({ item }) => <Text>{item}</Text>}
                        keyExtractor={(item, index) => index.toString()}
                    />
                    <Button title="Raum verlassen" onPress={leaveRoom} />
                </>
            ) : (
                <>
                    <Button title="Raum erstellen" onPress={createRoom} />
                    <TextInput
                        placeholder="Raumcode eingeben"
                        value={roomInput}
                        onChangeText={setRoomInput}
                        style={{ borderBottomWidth: 1, marginVertical: 10, width: 200 }}
                    />
                    <Button title="Raum beitreten" onPress={joinRoom} />
                </>
            )}
        </View>
    );
};

export default App;

