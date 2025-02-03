import { ScrollView, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { Picker } from "@react-native-picker/picker";
import { Link,router } from "expo-router";  // Updated import from expo-router
import InputField from "@/component/InputField";  // Assuming this is a custom component
import OAuth from "@/component/OAuth";
import { useSignUp } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Modal } from "react-native";


const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const [verification,setVerification] = useState({
    state:"default",
    error:"",
    code:"",
  });

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setVerification({
        ...verification,
        state:"pending",
      })
    } catch (err) {

      console.error(JSON.stringify(err, null, 2))
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        //Create a database user
        await AsyncStorage.setItem('userRole', form.role);
        console.log('Role saved:', form.role);
        await setActive({ session: signUpAttempt.createdSessionId })
        setVerification({
          ... verification,
          state:"success",
        })
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        setVerification({
          ... verification,
          error:"Verification failed",
          state: "failed"
        })
      }
    } catch (err) {
      setVerification({
        ... verification,
        error:"Verification failed",
        state: "failed"
      })
    }
  }
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <SafeAreaView style={styles.container}>
        <Text style={styles.welcomeText}>WELCOME TO SUSTAINIFY</Text>
        <Text style={styles.createText}>Create an Account</Text>
      </SafeAreaView>

      {/* Form Inputs */}
      <View style={styles.formContainer}>
        <InputField
          label="Name"
          placeholder="Enter your name"
          value={form.name}
          onChangeText={(value) => setForm({ ...form, name: value })}
        />
        <InputField
          label="Email"
          placeholder="Enter your email"
          value={form.email}
          onChangeText={(value) => setForm({ ...form, email: value })}
        />
        <InputField
          label="Password"
          placeholder="Enter your password"
          secureTextEntry={true}
          value={form.password}
          onChangeText={(value) => setForm({ ...form, password: value })}
        />

        {/* Role Selection Dropdown */}
        <Text style={styles.label}>Select Role</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.role}
            onValueChange={(value) => setForm({ ...form, role: value })}
            style={styles.picker}
          >
            <Picker.Item label="Select Role" value="" />
            <Picker.Item label="Buyer" value="buyer" />
            <Picker.Item label="Transporter" value="transporter" />
            <Picker.Item label="Seller" value="seller" />
          </Picker>
        </View>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <OAuth/>

      {/* Link to Sign In */}
      <View style={styles.contain}>
        <Text style={styles.text}>Already have an account? </Text>
        <Link href="/sign-in" style={styles.linkText}>Log In</Link> {/* Fixed Link */}
      </View>
      
  {verification.state === "pending" && (
  <View style={styles.overlay}>
    <View style={styles.modalContent}>
      <Text style={styles.verificationText}>
        We've sent a verification code to{" "}
        <Text style={styles.emailText}>{form.email}</Text>
      </Text>

      <InputField
        label="Verification Code"
        placeholder="Enter code"
        value={verification.code}
        onChangeText={(code) =>
          setVerification({ ...verification, code })
        }
      />
      

      {verification.error ? (
        <Text style={styles.errorText}>{verification.error}</Text>
      ) : null}

      <TouchableOpacity style={styles.button} onPress={onVerifyPress}>
        <Text style={styles.buttonText}>Verify Email</Text>
      </TouchableOpacity>
    </View>
  </View>
)}


      {verification.state === "success" && (
  <View style={styles.overlay}>
    <View style={styles.content}>
      <Text style={styles.verifiedText}>Verified</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => { 
        router.push("/")}}
      >
        <Text style={styles.buttonText}>Browse Home</Text>
      </TouchableOpacity>
    </View>
  </View>
)}


    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  content: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    width: 250,
  },
  verifiedText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#4CAF50", // Green text for success
  },
  contain: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    color: "#AAA", // Adjust color to match text-general-200
  },
  linkText: {
    fontSize: 16,
    color: "#085A2D", // Adjust color to match text-primary-500
    fontWeight: "600",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  container: {
    alignItems: "center",
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#085A2D",
    paddingBottom: 10,
    textAlign: "center",
  },
  createText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    textAlign: "center",
    paddingBottom: 15,
  },
  formContainer: {
    width: "90%",
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  pickerWrapper: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDD",
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  button: {
    marginTop: 30,
    backgroundColor: "#085A2D",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: "center",
    width: "90%",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    width: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, // For Android shadow
  },
  verificationText: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
    marginBottom: 10,
  },
  emailText: {
    fontWeight: "bold",
    color: "#085A2D",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
});

export default SignUp;
