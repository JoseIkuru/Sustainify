import { ScrollView , Text, TouchableOpacity, StyleSheet} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import InputField from "@/component/InputField";
import { useState } from "react";
const SignUp = () => {

  // const [form,setForm] = useState({
  //   name: '',
  //   email:'',
  //   password:'',
  // }
  // )
    return (
        <ScrollView>
        <SafeAreaView style={styles.container}>
            <Text style={styles.welcomeText}>
            WELCOME TO SUSTAINIFY
            </Text>
                <Text>Create an Account</Text>
        </SafeAreaView>

        {/* <View>

            <InputField
            label="Name"
            placeholder="Enter your name"
            value={}
            />
        </View>

 */}

        </ScrollView>
        )
    }
    
    const styles = StyleSheet.create({
        container: {
          flex: 1,
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
          paddingBottom: 15,
        },
        createText: {
            fontSize: 15, // You can increase this value for bigger text
            fontWeight: 'bold',
            color: 'black',
            alignItems: 'center',
            paddingBottom: 15,
          },
          roleText: {
            fontSize: 10, // You can increase this value for bigger text
            fontWeight: 'bold',
            color: '#989696',
            alignItems: 'center',
            paddingBottom: 15,
          },
        button1: {
            marginTop: 20, // Adds space between the text and the button
            backgroundColor: '#085A2D', // Button background color same as text
            paddingVertical: 12, // Vertical padding for the button
            paddingHorizontal: 30, // Horizontal padding for the button
            borderRadius: 5, // Rounded corners for the button
            alignItems: 'center', // Centers the text inside the button
            marginBottom:40
          },
          button2: {
            marginTop: 20, // Adds space between the text and the button
            backgroundColor: '#085A2D', // Button background color same as text
            paddingVertical: 12, // Vertical padding for the button
            paddingHorizontal: 30, // Horizontal padding for the button
            borderRadius: 5, // Rounded corners for the button
            alignItems: 'center', // Centers the text inside the button
            marginBottom:40
          },
          button3: {
            marginTop: 10, // Adds space between the text and the button
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

export default SignUp; 