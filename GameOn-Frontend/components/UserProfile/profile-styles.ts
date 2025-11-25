import { StyleSheet } from "react-native";
import { Colors, AccentColors } from "@/constants/colors";

export const profileStyles = StyleSheet.create({
  main: {
    alignItems: 'center',
  },
  profileImage: {
    width: 180,
    height: 180,
    borderRadius: 60,
    marginBottom: 10,
    marginHorizontal: 1,
    alignSelf: 'center'
    
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    marginTop: 20,
    alignSelf: 'center',
    width: 350
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffffff',
    marginTop: 10
  },
  email: {
    color: '#ffffffff',
    marginBottom: 8,
    fontSize: 20
  },
  gradient: { 
    flex: 1,
    position: 'absolute', 
    top: 0,
    left: 0, 
    right: 0, 
    bottom: 0
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 20,
    color: '#ffffffff',
  },
  editButton: {
  marginTop: 5,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderRadius: 25,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.3)',
},
editButtonText: {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: 20,
  fontWeight: '400',
},

buttonLogOut: {
  borderRadius: 25,
  marginBottom: 70,
  marginTop: 10,
  paddingHorizontal: 20,
  paddingVertical: 8,
  borderWidth: 1,
  alignItems: 'center',
  borderColor: Colors.salmon, 
},
buttonLogoutText: {  
  fontSize: 20,
  fontWeight: '400',
  color: Colors.salmon,
},
leagueItem: {
  backgroundColor: 'transparent',
  borderColor: '#444444ff',
  borderWidth: 1,
  padding: 14,
  paddingHorizontal: 60,
  borderRadius: 10,
  marginBottom: 10,
},
leagueName: {
  fontSize: 20,
  fontWeight: '500',
  color: '#ffffffff',
},
leagueRole: {
  color: '#6b7280',
  fontSize: 16,
},
container: {
        flexGrow: 1,
        padding: 20,
    },
  header: {
      fontSize: 36,
      fontWeight: "bold",
      color: "#fff",
      marginBottom: 20,
      textAlign: "center",
  },
  formGroup: {
      marginBottom: 10,
      marginTop: 10
  },
  label: {
      color: "#bbb",
      fontSize: 20,
      marginBottom: 6,
  },
  input: {
      backgroundColor: "#1e1e1e",
      color: "#fff",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
  },
  changePicText: {
      color: AccentColors.blue,
      marginTop: 8,
      textDecorationLine: 'underline',
      fontSize: 20,
      textAlign: 'center',
  },
  saveButton: {
      paddingVertical: 14,
      borderRadius: 20,
      alignItems: "center",
      marginTop: 20,
      borderColor: AccentColors.green,
      borderWidth: 2,
      width: 150,
      alignSelf: "center"
  },
  saveButtonText: {
      color: "#ffffffff",
      fontSize: 18,
      fontWeight: "bold",
  },
  cancelButton: {
      marginTop: 20,
      alignItems: "center",
      borderColor: Colors.salmon,
      borderWidth: 1,
      borderRadius: 20,
      paddingTop: 10,
      paddingBottom: 10,
      width: 150,
      alignSelf: "center"
  },
  cancelButtonText: {
      color: "#ffffffff",
      fontSize: 16,
  },

  pictureBorder: {
      borderRadius: 12,
      width: 220,
      alignSelf:"center"
  },
  flagsButton: {
    marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  flagsButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
});
