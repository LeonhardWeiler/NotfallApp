import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    paddingVertical: 50,
  },
  nameButton: {
    position: "absolute",
    top: "8%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  nameText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 15,
  },
  modalContainer: {
    backgroundColor: "#222",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    color: "white",
    borderBottomColor: "#666",
    borderBottomWidth: 1,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    color: "#FF9800",
    fontSize: 16,
  },
  saveButton: {
    color: "#4CAF50",
    fontSize: 16,
  },
  roomContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  roomText: {
    fontSize: 18,
    color: "#bbb",
  },
  emergencyButton: {
    backgroundColor: "#D32F2F",
    padding: 20,
    borderRadius: 10,
    marginVertical: 20,
  },
  emergencyButtonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  memberList: {
    maxHeight: 200,
    width: "80%",
  },
  memberText: {
    color: "#fff",
    textAlign: "center",
  },
  leaveButtonContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    alignItems: "center",
  },
  joinContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  inputContainer: {
    position: "relative",
    width: "60%",
    marginVertical: 20,
  },
  roomInput: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 5,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 40,
    color: "white",
    minWidth: "100%",
  },
  arrowButton: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -13 }],
  },
  arrowText: {
    fontSize: 16,
    color: "#4CAF50",
  },
  roomsList: {
    maxHeight: 200,
    width: "80%",
    overflow: "hidden",
  },
  roomsText: {
    color: "#fff",
    fontSize: 16,
  },
  roomsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
    width: "80%",
  },
  roomsFlatList: {
    alignItems: "center",
  },
});

