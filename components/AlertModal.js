import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";

const AlertModal = ({ isVisible, title, message, onClose }) => {
  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      onBackdropPress={onClose}
    >
      <View style={{ backgroundColor: "#222", padding: 20, borderRadius: 10, alignItems: "flex-start" }}>
        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>{title}</Text>
        <Text style={{ color: "#bbb", fontSize: 16, marginBottom: 20 }}>{message}</Text>
        <TouchableOpacity onPress={onClose} style={{ alignSelf: "flex-end", padding: 10 }}>
          <Text style={{ color: "#4CAF50", fontSize: 16 }}>OK</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default AlertModal;

