import { View , Text, TouchableOpacity, StyleSheet} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import {router} from "expo-router"
const Welcome = () => {
    return (
        <SafeAreaView style={styles.container}>
        <Text style={styles.welcomeText}>
        WELCOME TO SUSTAINIFY
      </Text>
      <TouchableOpacity style={styles.button} 
      onPress={() => {
        router.replace("/(auth)/sign-up");
      }}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 6,
      backgroundColor: 'white',
      justifyContent: 'flex-start',
      alignItems: 'center',
      paddingTop: 100,
      paddingBottom: 10,
    },
    welcomeText: {
      fontSize: 20, // You can increase this value for bigger text
      fontWeight: 'bold',
      color: '#085A2D',
    },
    button: {
        marginTop: 20, // Adds space between the text and the button
        backgroundColor: '#085A2D', // Button background color same as text
        paddingVertical: 12, // Vertical padding for the button
        paddingHorizontal: 30, // Horizontal padding for the button
        borderRadius: 5, // Rounded corners for the button
        alignItems: 'center', // Centers the text inside the button
      },
      buttonText: {
        color: 'white', // Text color of the button
        fontSize: 18, // Font size of the button text
        fontWeight: 'bold', // Makes the button text bold
      },
  });

export default Welcome; 